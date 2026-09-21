import { step } from '@novu/framework/step-resolver';

export default step.sms(
  'sms-step',
  async (_controls, { payload, subscriber }) => ({
    body: `Crab Learn: ${payload.message ?? 'Your password verification code is ready.'}`,
  }),
  {
    controlSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    } as const,
  }
);
