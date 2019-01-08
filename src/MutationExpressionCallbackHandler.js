/**
 * Callback handler for mutation expressions.
 *
 * This handler should not be added as a handler manually.
 * It is created by MutationExpressionHandler as part of the callback
 * to provide a mutationExpression field.
 *
 * Requires:
 * - a pathExpression property on the path proxy and all non-raw arguments.
 */
export default class MutationExpressionCallbackHandler {
  constructor({ mutationType, args }) {
    this._mutationType = mutationType;
    this._args = args;
  }

  async execute(path, proxy) {
    // Check if the given arguments are valid
    if (!this._args.length)
      throw new Error(`Mutation on ${path} can not be invoked without arguments`);

    // Check if we have a valid path
    const domainExpression = await proxy.pathExpression;
    if (!Array.isArray(domainExpression))
      throw new Error(`${path} has no pathExpression property`);

    // Require at least a subject and a link
    if (domainExpression.length < 2)
      throw new Error(`${path} should at least contain a subject and a predicate`);

    // The last path segment represents the predicate of the triple to insert
    const predicate = domainExpression.splice(domainExpression.length - 1)[0].predicate;
    if (!predicate)
      throw new Error(`Expected predicate in ${path}`);

    // Determine right variables and patterns
    const mutationExpressions = [];
    for (let argument of this._args) {
      // If an argument does not expose a pathExpression, we consider it a raw value.
      let rangeExpression = await argument.pathExpression;
      if (!Array.isArray(rangeExpression))
        rangeExpression = [{ subject: `"${argument}"` }];

      // Store the domain, predicate and range in the insert expression.
      mutationExpressions.push({
        mutationType: this._mutationType,
        domainExpression,
        predicate,
        rangeExpression,
      });
    }

    return mutationExpressions;
  }
}