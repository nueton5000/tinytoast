import { util } from '@aws-appsync/utils';

/**
 * Request function to increment profile view count
 * Uses composite key (profileId + date) for atomic increment
 * @param {import('@aws-appsync/utils').Context} ctx
 */
export function request(ctx) {
  const { profileId } = ctx.args;
  const today = new Date().toISOString().split('T')[0];

  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues({
      profileId: profileId,
      date: today
    }),
    update: {
      expression: 'SET viewCount = if_not_exists(viewCount, :zero) + :inc, updatedAt = :now, #owner = :owner',
      expressionNames: {
        '#owner': 'owner'
      },
      expressionValues: util.dynamodb.toMapValues({
        ':zero': 0,
        ':inc': 1,
        ':now': util.time.nowISO8601(),
        ':owner': profileId
      })
    }
  };
}

/**
 * Response function to process the update result
 * @param {import('@aws-appsync/utils').Context} ctx
 */
export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }

  return {
    success: true,
    viewCount: ctx.result.viewCount || 1
  };
}
