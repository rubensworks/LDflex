import SparqlHandler from './SparqlHandler';

/**
 * Executes the query represented by a path.
 */
export default class ExecuteQueryHandler extends SparqlHandler {
  constructor(options = {}) {
    super(options);
    this._single = options.single;
  }

  execute(path) {
    let results;
    const next = async () => {
      if (!results) {
        // Retrieve the query engine and query
        const { queryEngine } = path.settings;
        if (!queryEngine)
          throw new Error(`No query engine defined in ${path}`);
        const query = super.execute(path);
        // Create an asynchronous iterator over the query results
        results = queryEngine.execute(await query);
      }
      // Obtain the next binding and extract the result term
      const { value, done } = await results.next();
      return done ? { done } : { value: this.extractTerm(value) };
    };

    // Return either an asynchronous iterator, or a promise to a single value
    return !this._single ? () => ({ next }) :
      (resolve, reject) => next().then(v => resolve(v.value), reject);
  }

  /**
   * Extracts the first term from a query result binding.
   */
  extractTerm(binding) {
    // Extract the first term from the binding map
    if (binding.size !== 1)
      throw new Error('Only single-variable queries are supported');
    const term = binding.values().next().value;

    // Simplify string conversion of the term
    term.toString = Term.prototype.getValue;
    term.toPrimitive = Term.prototype.getValue;

    return term;
  }
}

class Term {
  getValue() {
    return this.value;
  }
}
