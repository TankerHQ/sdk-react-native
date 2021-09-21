import { Platform } from 'react-native';

const SERVER_URL =
  Platform.OS === 'ios' ? 'http://127.0.0.1:5000' : 'http://10.0.2.2:5000';

export async function serverCleanup(): Promise<void> {
  await fetch(`${SERVER_URL}/cleanup`);
}

export async function getAppId(): Promise<string> {
  return await (await fetch(`${SERVER_URL}/get_app_id`)).text();
}

export async function getTankerUrl(): Promise<string> {
  return await (await fetch(`${SERVER_URL}/get_tanker_url`)).text();
}

export async function toggleSessionCertificates(
  enable: boolean
): Promise<void> {
  const form = new FormData();
  form.append('enable', enable);
  await fetch(`${SERVER_URL}/toggle_session_certificates`, {
    method: 'POST',
    body: form,
  });
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

export async function getVerificationCode(email: string): Promise<string> {
  const form = new FormData();
  form.append('email', email);
  return await (
    await fetch(`${SERVER_URL}/get_verification_code`, {
      method: 'POST',
      body: form,
    })
  ).text();
}

export async function getSMSVerificationCode(
  phoneNumber: string
): Promise<string> {
  const form = new FormData();
  form.append('phone_number', phoneNumber);
  return await (
    await fetch(`${SERVER_URL}/get_verification_code`, {
      method: 'POST',
      body: form,
    })
  ).text();
}
