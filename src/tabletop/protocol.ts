import {
  boardSchema,
  gridConfigSchema,
  MessageType,
  messageLogSchema,
  sceneSchema,
  tokenSchema,
  uuidSchema,
} from '@motor-vtt/contracts';
import { z } from 'zod';

export const DEMO_GRID_DEFAULTS = gridConfigSchema.parse({
  enabled: true,
  size: 64,
  color: '#e5d2a3',
  opacity: 0.28,
});

export const tabletopStateSchema = z.object({
  v: z.literal(1),
  roomId: uuidSchema,
  board: boardSchema,
  scene: sceneSchema,
  tokens: z.array(tokenSchema),
});

export const presencePayloadSchema = z.object({
  v: z.literal(1),
  roomId: uuidSchema,
  onlineUserIds: z.array(uuidSchema),
});

export const tokenAddedPayloadSchema = z.object({
  v: z.literal(1),
  token: tokenSchema,
});

export const tokenMovedPayloadSchema = tokenAddedPayloadSchema;

export const tokenRemovedPayloadSchema = z.object({
  v: z.literal(1),
  tokenId: uuidSchema,
  sceneId: uuidSchema,
});

const socketOperationErrorSchema = z.object({
  v: z.literal(1),
  code: z.string().min(1),
  message: z.string().min(1),
});

export const operationAckSchema = z.union([
  z.object({
    v: z.literal(1),
    ok: z.literal(true),
    token: tokenSchema.optional(),
    tokenId: uuidSchema.optional(),
  }),
  z.object({
    v: z.literal(1),
    ok: z.literal(false),
    error: socketOperationErrorSchema,
  }),
]);

export const socketErrorSchema = socketOperationErrorSchema;

export const joinRoomPayloadSchema = z.object({
  v: z.literal(1),
  roomId: uuidSchema,
});

export const tokenCreatePayloadSchema = tokenSchema.omit({ id: true, cenaId: true }).strict();

export const tokenMoveRequestSchema = z.object({
  v: z.literal(1),
  tokenId: uuidSchema,
  x: z.number().finite(),
  y: z.number().finite(),
});

export const tokenRemoveRequestSchema = z.object({
  v: z.literal(1),
  tokenId: uuidSchema,
});

const safeIntegerSchema = z.number().int().safe();

export const diceRollResultSchema = z.object({
  expression: z.string().min(1).max(1000),
  repetitionCount: z.number().int().min(1).max(100),
  dicePerRepetition: z.number().int().min(1).max(100),
  sides: z.number().int().min(2).max(1_000_000),
  modifiers: z.object({
    exploding: z.boolean(),
    noSort: z.boolean(),
    arithmetic: z.object({
      kind: z.enum(['TOTAL', 'PER_DIE', 'SUCCESS']),
      operator: z.enum(['+', '-', '++', '--', '>>', '<<']),
      value: safeIntegerSchema,
    }).nullable(),
  }),
  repetitions: z.array(z.object({
    repetition: z.number().int().min(1).max(100),
    dice: z.array(z.object({
      rolls: z.array(safeIntegerSchema).min(1).max(101),
      modifiedRolls: z.array(safeIntegerSchema).min(1).max(101),
      rawTotal: safeIntegerSchema,
      modifiedTotal: safeIntegerSchema,
      explosionLimitReached: z.boolean(),
    })).min(1).max(100),
    rawRolls: z.array(safeIntegerSchema).min(1).max(10_100),
    displayRolls: z.array(safeIntegerSchema).min(1).max(10_100),
    modifiedRolls: z.array(safeIntegerSchema).min(1).max(10_100),
    displayModifiedRolls: z.array(safeIntegerSchema).min(1).max(10_100),
    total: safeIntegerSchema.nullable(),
    successes: safeIntegerSchema.nullable(),
    explosionLimitReached: z.boolean(),
  })).min(1).max(100),
});

export const tabletopMessageSchema = messageLogSchema.strict().superRefine((message, context) => {
  if (message.tipo !== MessageType.ROLAGEM) return;
  const roll = diceRollResultSchema.safeParse(message.metadata?.roll);
  if (!roll.success) {
    context.addIssue({
      code: 'custom',
      path: ['metadata', 'roll'],
      message: 'Resultado de rolagem inválido.',
    });
  }
});

export const messageSendPayloadSchema = z.strictObject({
  v: z.literal(1),
  content: z.string().trim().min(1).max(1000),
});

export const messagesPayloadSchema = z.object({
  v: z.literal(1),
  roomId: uuidSchema,
  messages: z.array(tabletopMessageSchema).max(50),
});

export const messageCreatedPayloadSchema = z.object({
  v: z.literal(1),
  message: tabletopMessageSchema,
});

export type TabletopState = z.infer<typeof tabletopStateSchema>;
export type PresencePayload = z.infer<typeof presencePayloadSchema>;
export type TabletopToken = z.infer<typeof tokenSchema>;
export type GridConfig = z.infer<typeof gridConfigSchema>;
export type TabletopMessage = z.infer<typeof tabletopMessageSchema>;
export type DiceRollResult = z.infer<typeof diceRollResultSchema>;
