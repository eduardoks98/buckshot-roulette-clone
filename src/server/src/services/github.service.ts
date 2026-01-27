// ==========================================
// GITHUB INTEGRATION SERVICE
// ==========================================

import { BugCategory, BugPriority } from '../../../shared/types/bug.types';

// ==========================================
// TYPES
// ==========================================

interface GitHubIssue {
  number: number;
  html_url: string;
  state: string;
  title: string;
}

interface CreateIssueParams {
  title: string;
  description: string;
  category: BugCategory;
  priority: BugPriority;
  reportId: string;
  reporterName?: string;
  gameRoomCode?: string | null;
}

// ==========================================
// LABEL MAPPINGS
// ==========================================

const CATEGORY_LABELS: Record<BugCategory, string> = {
  GAMEPLAY: 'gameplay',
  UI: 'ui',
  CONNECTION: 'connection',
  PERFORMANCE: 'performance',
  OTHER: 'other',
};

const PRIORITY_LABELS: Record<BugPriority, string> = {
  LOW: 'priority: low',
  MEDIUM: 'priority: medium',
  HIGH: 'priority: high',
  CRITICAL: 'priority: critical',
};

// ==========================================
// SERVICE CLASS
// ==========================================

class GitHubService {
  private token: string | undefined;
  private owner: string | undefined;
  private repo: string | undefined;

  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.owner = process.env.GITHUB_OWNER;
    this.repo = process.env.GITHUB_REPO;
  }

  isConfigured(): boolean {
    return !!(this.token && this.owner && this.repo);
  }

  // Create a GitHub issue from a bug report
  async createIssue(params: CreateIssueParams): Promise<GitHubIssue | null> {
    if (!this.isConfigured()) {
      console.warn('[GitHub] Integration not configured. Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO.');
      return null;
    }

    try {
      const labels = [
        'bug',
        CATEGORY_LABELS[params.category],
        PRIORITY_LABELS[params.priority],
      ];

      const body = this.formatIssueBody(params);

      const response = await fetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}/issues`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `[Bug Report] ${params.title}`,
            body,
            labels,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('[GitHub] Failed to create issue:', error);
        return null;
      }

      const issue = await response.json() as GitHubIssue;
      console.log(`[GitHub] Issue created: #${issue.number} - ${issue.html_url}`);

      return {
        number: issue.number,
        html_url: issue.html_url,
        state: issue.state,
        title: issue.title,
      };
    } catch (error) {
      console.error('[GitHub] Error creating issue:', error);
      return null;
    }
  }

  // Get issue status
  async getIssueState(issueNumber: number): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.owner}/${this.repo}/issues/${issueNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const issue = await response.json() as GitHubIssue;
      return issue.state;
    } catch (error) {
      console.error('[GitHub] Error fetching issue:', error);
      return null;
    }
  }

  // Sync all bug reports with GitHub issue states
  async syncIssueStates(bugReports: Array<{ id: string; git_issue_number: number | null }>): Promise<Map<string, string>> {
    const stateMap = new Map<string, string>();

    if (!this.isConfigured()) {
      return stateMap;
    }

    for (const report of bugReports) {
      if (report.git_issue_number) {
        const state = await this.getIssueState(report.git_issue_number);
        if (state) {
          stateMap.set(report.id, state);
        }
      }
    }

    return stateMap;
  }

  private formatIssueBody(params: CreateIssueParams): string {
    const sections = [
      '## Descricao',
      params.description,
      '',
      '## Detalhes',
      `- **Categoria:** ${params.category}`,
      `- **Prioridade:** ${params.priority}`,
      `- **Report ID:** \`${params.reportId}\``,
    ];

    if (params.reporterName) {
      sections.push(`- **Reportado por:** ${params.reporterName}`);
    }

    if (params.gameRoomCode) {
      sections.push(`- **Sala do jogo:** \`${params.gameRoomCode}\``);
    }

    sections.push('', '---', '*Issue criada automaticamente via Central de Chamados*');

    return sections.join('\n');
  }
}

export const githubService = new GitHubService();
