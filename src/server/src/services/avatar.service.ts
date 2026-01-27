// ==========================================
// AVATAR SERVICE
// ==========================================
// Baixa e armazena avatares localmente para evitar
// problemas com URLs externas (Google, etc.)
// ==========================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import http from 'http';

// ==========================================
// CONFIGURAÇÃO
// ==========================================

const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars');

// Garantir que o diretório existe
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// ==========================================
// AVATAR SERVICE CLASS
// ==========================================

class AvatarService {
  /**
   * Baixa uma imagem de URL externa e salva localmente
   * Retorna o nome do arquivo salvo ou null se falhar
   */
  async downloadAndSave(imageUrl: string, userId: string): Promise<string | null> {
    try {
      // Gerar nome único para o arquivo
      const hash = crypto.createHash('md5').update(userId).digest('hex');
      const extension = this.getExtensionFromUrl(imageUrl);
      const filename = `${hash}${extension}`;
      const filepath = path.join(AVATARS_DIR, filename);

      // Se já existe, verificar se precisa atualizar
      // (podemos forçar re-download a cada login ou usar cache)

      // Baixar imagem
      const imageBuffer = await this.downloadImage(imageUrl);

      if (!imageBuffer || imageBuffer.length === 0) {
        console.error('[Avatar] Imagem vazia ou erro no download');
        return null;
      }

      // Salvar arquivo
      fs.writeFileSync(filepath, imageBuffer);
      console.log(`[Avatar] Salvo: ${filename} (${imageBuffer.length} bytes)`);

      return filename;
    } catch (error) {
      console.error('[Avatar] Erro ao baixar/salvar avatar:', error);
      return null;
    }
  }

  /**
   * Baixa imagem de URL
   */
  private downloadImage(url: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(url, { timeout: 10000 }, (response) => {
        // Seguir redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.downloadImage(redirectUrl).then(resolve);
            return;
          }
        }

        if (response.statusCode !== 200) {
          console.error(`[Avatar] HTTP ${response.statusCode} ao baixar imagem`);
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', (err) => {
          console.error('[Avatar] Erro no response:', err);
          resolve(null);
        });
      });

      request.on('error', (err) => {
        console.error('[Avatar] Erro na requisição:', err);
        resolve(null);
      });

      request.on('timeout', () => {
        console.error('[Avatar] Timeout ao baixar imagem');
        request.destroy();
        resolve(null);
      });
    });
  }

  /**
   * Extrai extensão da URL ou usa .jpg como padrão
   */
  private getExtensionFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const ext = path.extname(pathname).toLowerCase();

      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        return ext;
      }
    } catch {
      // URL inválida
    }

    return '.jpg'; // Padrão
  }

  /**
   * Retorna o caminho completo do avatar
   */
  getAvatarPath(filename: string): string | null {
    const filepath = path.join(AVATARS_DIR, filename);
    if (fs.existsSync(filepath)) {
      return filepath;
    }
    return null;
  }

  /**
   * Verifica se avatar existe
   */
  avatarExists(filename: string): boolean {
    const filepath = path.join(AVATARS_DIR, filename);
    return fs.existsSync(filepath);
  }

  /**
   * Gera URL local para o avatar
   */
  getLocalAvatarUrl(filename: string): string {
    return `/api/avatars/${filename}`;
  }

  /**
   * Deleta avatar antigo
   */
  deleteAvatar(filename: string): boolean {
    try {
      const filepath = path.join(AVATARS_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const avatarService = new AvatarService();
export { AVATARS_DIR };
