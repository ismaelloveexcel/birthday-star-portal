import type {
  ExperienceAdapter,
  ExperienceAdapterCommandInput,
  ExperienceAdapterInput,
  ExperienceAdapterOutput,
  ExperienceStateHint,
} from './contracts'

export type { ExperienceAdapter }

export const placeholderExperienceAdapter: ExperienceAdapter = {
  async start(input: ExperienceAdapterInput): Promise<ExperienceAdapterOutput> {
    return {
      proposedEvents: [
        {
          sessionId: input.sessionId,
          playerId: null,
          eventType: 'experience_event_emitted',
          payload: { kind: 'start' },
          idempotencyKey: null,
        },
      ],
    }
  },

  async handleCommand(
    input: ExperienceAdapterCommandInput,
  ): Promise<ExperienceAdapterOutput> {
    const label =
      typeof input.commandPayload?.label === 'string'
        ? input.commandPayload.label
        : 'checkpoint'
    return {
      proposedEvents: [
        {
          sessionId: input.sessionId,
          playerId: input.actingPlayerId,
          eventType: 'checkpoint_reached',
          payload: { label },
          idempotencyKey: null,
        },
      ],
    }
  },

  async getStateHint(
    input: ExperienceAdapterInput,
  ): Promise<ExperienceStateHint> {
    return {
      checkpointCount: input.snapshot.state.checkpointCount,
      canEmitCheckpoint: true,
    }
  },
}
