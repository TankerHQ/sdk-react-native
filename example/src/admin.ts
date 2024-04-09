import { Platform } from 'react-native';

const SERVER_URL =
  Platform.OS === 'ios' ? 'http://127.0.0.1:5000' : 'http://10.0.2.2:5000';

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

export async function getEmailVerificationCode(email: string): Promise<string> {
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

export async function appUpdate(
  oidcClientId: string,
  oidcDisplayName: string,
  oidcIssuer: string
): Promise<void> {
  const form = new FormData();
  form.append('oidc_client_id', oidcClientId);
  form.append('oidc_display_name', oidcDisplayName);
  form.append('oidc_issuer', oidcIssuer);

  await (
    await fetch(`${SERVER_URL}/app_update`, {
      method: 'POST',
      body: form,
    })
  ).text();
}

export type OidcConfig = {
  client_id: string;
  client_secret: string;
  provider_name: string;
  issuer: string;
  fake_oidc_issuer_url: string;
  users: { [name: string]: OidcUser };
};

export type OidcUser = {
  email: string;
  refresh_token: string;
};

export async function getOidcConfig(): Promise<OidcConfig> {
  return await (await fetch(`${SERVER_URL}/get_oidc_config`)).json();
}

export async function getGoogleIdToken(
  oidcConfig: OidcConfig,
  oidcUser: OidcUser
): Promise<string> {
  const formData = JSON.stringify({
    client_id: oidcConfig.client_id,
    client_secret: oidcConfig.client_secret,
    grant_type: 'refresh_token',
    refresh_token: oidcUser.refresh_token,
  });

  const url = 'https://www.googleapis.com/oauth2/v4/token';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const description = `${response.status} ${response.statusText}: ${await response.text()}`;
    throw new Error(`Failed to get an ID token from ${url}:\n${description}`);
  }

  const data = await response.json();
  return data.id_token;
}
