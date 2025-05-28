import { Router } from 'express';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATH_ROUTER = __dirname;

const router = Router();

/**
 * Limpia el nombre del archivo (remueve la extensión).
 */
const cleanFileName = (fileName) => fileName.split('.').shift();

readdirSync(PATH_ROUTER).filter((fileName) => fileName.endsWith('.js')).forEach((fileName) => {
    const cleanName = cleanFileName(fileName);
    if (cleanName !== "index") {
        import(`./${cleanName}.js`).then((moduleRouter) => {
            if (moduleRouter && moduleRouter.router) {
                router.use(`/api/${cleanName}`, moduleRouter.router);
            } else {
                console.error(`El archivo ${cleanName} no exporta un router válido.`);
            }
        }).catch((error) => {
            console.error(`Error al importar el módulo ${cleanName}:`, error);
        });
    }
});

export { router };
