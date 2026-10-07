import { describe, expect, it } from 'vitest';

import { resolveTabletopSocketOrigin } from './connection';

describe('origem da conexão tabletop', () => {
  it('usa a origem do backend sem transformar o caminho da API em namespace Socket.IO', () => {
    expect(resolveTabletopSocketOrigin('http://localhost:3000/api', 'http://localhost:5173'))
      .toBe('http://localhost:3000');
  });

  it('resolve URLs relativas para a origem da página', () => {
    expect(resolveTabletopSocketOrigin('/api', 'http://localhost:5173'))
      .toBe('http://localhost:5173');
  });

  it('usa a origem da página quando a API não define uma URL', () => {
    expect(resolveTabletopSocketOrigin(undefined, 'http://localhost:5173'))
      .toBe('http://localhost:5173');
  });
});
