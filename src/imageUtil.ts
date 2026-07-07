// 画像(Data URL)を縮小＋JPEG化して容量を小さくする。
// localStorage（約5MB）に収めるため、保存前の画像に適用する。

export function compressImageDataUrl(
  dataUrl: string,
  maxDim = 1024,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      // 透過画像でも黒くならないよう白背景で塗ってから描画
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl); // 失敗時は元のまま
    img.src = dataUrl;
  });
}
