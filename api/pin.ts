import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { pin } = req.body || {};
  const expectedPin = process.env.FACILITATOR_PIN?.trim() || '2110';

  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ valid: false, error: 'Debes ingresar un PIN' });
  }

  if (pin.trim() === expectedPin) {
    return res.status(200).json({ valid: true, message: 'Acceso autorizado' });
  }

  return res.status(401).json({ valid: false, error: 'PIN incorrecto. Intenta nuevamente.' });
}
