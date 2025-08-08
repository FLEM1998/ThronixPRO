import { Router } from 'express';
import { createReadStream, existsSync, statSync } from 'fs';
import { join } from 'path';

const router = Router();

// Serve download files
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = join(process.cwd(), filename);
  
  if (!existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const stats = statSync(filepath);
  const fileSize = stats.size;
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', fileSize);
  
  const stream = createReadStream(filepath);
  stream.pipe(res);
});

export default router;