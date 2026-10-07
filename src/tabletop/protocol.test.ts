import { describe, expect, it } from 'vitest';
import { MessageType } from '@motor-vtt/contracts';

import {
  DEMO_GRID_DEFAULTS,
  diceRollResultSchema,
  joinRoomPayloadSchema,
  messageCreatedPayloadSchema,
  messageSendPayloadSchema,
  messagesPayloadSchema,
  presencePayloadSchema,
  tokenAddedPayloadSchema,
  tokenCreatePayloadSchema,
  tokenMoveRequestSchema,
  tokenRemovedPayloadSchema,
  tabletopStateSchema,
  operationAckSchema,
} from './protocol';

const id = crypto.randomUUID();

function makeState() {
  const now = new Date().toISOString();
  return {
    v: 1,
    roomId: id,
    board: {
      id: crypto.randomUUID(),
      salaId: id,
      nome: 'Tabuleiro principal',
      cenaAtivaId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    },
    scene: {
      id: crypto.randomUUID(),
      tabuleiroId: crypto.randomUUID(),
      nome: 'Cena principal',
      backgroundUrl: null,
      gridConfig: { enabled: true, size: 64, opacity: 0.5 },
      visivel: true,
      createdAt: now,
      updatedAt: now,
    },
    tokens: [{
      id: crypto.randomUUID(),
      cenaId: crypto.randomUUID(),
      nome: 'Aventureiro',
      x: 128,
      y: 192,
      escala: 1,
    }],
  };
}

describe('protocolo tabletop v1', () => {
  it('fornece defaults explícitos para o grid local da demonstração', () => {
    expect(DEMO_GRID_DEFAULTS).toEqual({
      enabled: true,
      size: 64,
      color: '#e5d2a3',
      opacity: 0.28,
    });
  });

  it('valida estado inicial, cena e tokens com contratos compartilhados', () => {
    expect(tabletopStateSchema.safeParse(makeState()).success).toBe(true);
    const invalid = makeState();
    invalid.tokens[0]!.escala = 0;
    expect(tabletopStateSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejeita ids inválidos e movimentos não finitos', () => {
    expect(joinRoomPayloadSchema.safeParse({ v: 1, roomId: 'not-a-uuid' }).success).toBe(false);
    expect(tokenMoveRequestSchema.safeParse({
      v: 1,
      tokenId: crypto.randomUUID(),
      x: Number.NaN,
      y: 1,
    }).success).toBe(false);
  });

  it('valida presença e eventos de remoção antes de alterar o estado local', () => {
    expect(presencePayloadSchema.safeParse({
      v: 1,
      roomId: id,
      onlineUserIds: [crypto.randomUUID()],
    }).success).toBe(true);
    expect(tokenRemovedPayloadSchema.safeParse({
      v: 1,
      tokenId: 'bad-token',
      sceneId: crypto.randomUUID(),
    }).success).toBe(false);
  });

  it('exige erro explícito em confirmações de operação rejeitadas', () => {
    expect(operationAckSchema.safeParse({ v: 1, ok: false }).success).toBe(false);
    expect(operationAckSchema.safeParse({
      v: 1,
      ok: false,
      error: { v: 1, code: 'MASTER_REQUIRED', message: 'Somente o mestre.' },
    }).success).toBe(true);
  });

  it('aceita adição sem id e impede que o cliente escolha ids ou cena', () => {
    expect(tokenCreatePayloadSchema.safeParse({
      nome: 'Goblin',
      x: 32,
      y: 64,
      escala: 1,
    }).success).toBe(true);
    expect(tokenCreatePayloadSchema.safeParse({
      id: crypto.randomUUID(),
      cenaId: crypto.randomUUID(),
      nome: 'Goblin',
      x: 32,
      y: 64,
      escala: 1,
    }).success).toBe(false);
    expect(tokenAddedPayloadSchema.safeParse({
      v: 1,
      token: {
        ...tokenCreatePayloadSchema.parse({ nome: 'Goblin', x: 32, y: 64, escala: 1 }),
        id: crypto.randomUUID(),
        cenaId: crypto.randomUUID(),
      },
    }).success).toBe(true);
  });

  it('valida mensagens de chat, resultados do servidor e payloads sem resultados do cliente', () => {
    const now = new Date().toISOString();
    const roll = {
      expression: '2d4+2',
      repetitionCount: 1,
      dicePerRepetition: 2,
      sides: 4,
      modifiers: {
        exploding: false,
        noSort: false,
        arithmetic: { kind: 'TOTAL', operator: '+', value: 2 },
      },
      repetitions: [{
        repetition: 1,
        dice: [
          { rolls: [1], modifiedRolls: [1], rawTotal: 1, modifiedTotal: 1, explosionLimitReached: false },
          { rolls: [4], modifiedRolls: [4], rawTotal: 4, modifiedTotal: 4, explosionLimitReached: false },
        ],
        rawRolls: [1, 4],
        displayRolls: [4, 1],
        modifiedRolls: [1, 4],
        displayModifiedRolls: [4, 1],
        total: 7,
        successes: null,
        explosionLimitReached: false,
      }],
    };
    const message = {
      id: crypto.randomUUID(),
      salaId: id,
      autorId: crypto.randomUUID(),
      tipo: MessageType.ROLAGEM,
      conteudo: '2d4+2',
      secreto: false,
      metadata: { roll },
      createdAt: now,
    };

    expect(diceRollResultSchema.safeParse(roll).success).toBe(true);
    expect(messageCreatedPayloadSchema.safeParse({ v: 1, message }).success).toBe(true);
    expect(messagesPayloadSchema.safeParse({ v: 1, roomId: id, messages: [message] }).success).toBe(true);
    expect(messageSendPayloadSchema.safeParse({ v: 1, content: ' Olá ' }).success).toBe(true);
    expect(messageSendPayloadSchema.safeParse({
      v: 1,
      content: '2d4+2',
      result: 7,
    }).success).toBe(false);
    expect(messageCreatedPayloadSchema.safeParse({
      v: 1,
      message: { ...message, metadata: { roll: { ...roll, repetitions: [] } } },
    }).success).toBe(false);
  });
});
