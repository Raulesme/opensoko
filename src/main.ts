import { APP_NAME } from './meta';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const ctx = canvas?.getContext('2d');
if (canvas && ctx) {
  canvas.width = 320;
  canvas.height = 180;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(APP_NAME, canvas.width / 2, canvas.height / 2);
}
