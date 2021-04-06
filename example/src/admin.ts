const SERVER_URL = 'http://10.0.2.2:5000';

export async function getAppId(): string {
  return await (await fetch(`${SERVER_URL}/get_app_id`)).text();
}

export async function createIdentity(): string {
  return await (await fetch(`${SERVER_URL}/create_identity`)).text();
}

export async function createProvisionalIdentity(email: string): string {
  const form = new FormData();
  form.append('email', email);
  return await (await fetch(`${SERVER_URL}/create_provisional_identity`, { method: 'POST', body: form })).text();
}

export async function getPublicIdentity(identity: string): string {
  const form = new FormData();
  form.append('identity', identity);
  return await (await fetch(`${SERVER_URL}/get_public_identity`, { method: 'POST', body: form })).text();
}
