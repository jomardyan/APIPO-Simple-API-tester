export const HTTP_METHODS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'HEAD', value: 'HEAD' },
  { label: 'OPTIONS', value: 'OPTIONS' }
];

export const DEFAULT_REQUEST = {
  method: 'GET',
  url: '',
  headers: [{ id: 'header-1', key: '', value: '' }],
  params: [{ id: 'param-1', key: '', value: '' }],
  bodyMode: 'json',
  body: '',
  formData: [{ id: 'form-1', key: '', value: '' }],
  preRequestScript: '',
  testScript: '',
  auth: {
    type: 'none',
    token: '',
    oauthToken: '',
    apiKeyKey: '',
    apiKeyValue: '',
    apiKeyAddTo: 'header',
    username: '',
    password: ''
  }
};

export const THEMES = ['system', 'light', 'dark'];
