const BASE_URL = 'http://localhost:3000/api';

export async function uploadMedia(
  file: File
): Promise<{ url: string; key: string; fileType: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('sweetcorn_jwt_token');

  const res = await fetch(`${BASE_URL}/media/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '上传失败' }));
    throw new Error(err.message || '上传失败');
  }

  const data = await res.json();
  return { url: data.url, key: data.key, fileType: data.fileType };
}
