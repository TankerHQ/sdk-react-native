const SERVER_URL = 'http://10.0.2.2:5000';

export async function getAppId(): Promise<string> {
  return await (await fetch(`${SERVER_URL}/get_app_id`)).text();
}

export async function getTankerUrl(): Promise<string> {
  return await (await fetch(`${SERVER_URL}/get_tanker_url`)).text();
}

export async function createIdentity(): Promise<string> {
  return await (await fetch(`${SERVER_URL}/create_identity`)).text();
}

export async function createProvisionalIdentity(
  email: string
): Promise<string> {
  const form = new FormData();
  form.append('email', email);
  return await (
    await fetch(`${SERVER_URL}/create_provisional_identity`, {
      method: 'POST',
      body: form,
    })
  ).text();
}

export async function getPublicIdentity(identity: string): Promise<string> {
  const form = new FormData();
  form.append('identity', identity);
  return await (
    await fetch(`${SERVER_URL}/get_public_identity`, {
      method: 'POST',
      body: form,
    })
  ).text();
}
