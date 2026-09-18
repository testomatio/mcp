export const shareMethods = {
  registerShareHandlers(handlers) {
    handlers.tests_share = async (args = {}) => {
      const payload = {
        target_project_id: this.pickRequiredArg(args, 'target_project_id'),
        target_suite_id: this.pickRequiredArg(args, 'target_suite_id'),
      };
      this.pickSelectionArgs(args, ['test_ids', 'labels'], payload);
      return this.asText(await this.apiClient.create('shares/tests', payload));
    };

    handlers.suites_share = async (args = {}) => {
      const payload = {
        target_project_ids: this.pickRequiredArg(args, 'target_project_ids'),
      };
      this.pickSelectionArgs(args, ['suite_ids', 'labels'], payload);
      if (args.destination_folder_id !== undefined) {
        payload.destination_folder_id = args.destination_folder_id;
      }
      return this.asText(await this.apiClient.create('shares/suites', payload));
    };

    handlers.tests_unshare = async (args = {}) =>
      this.asText(await this.apiClient.delete('shares/tests', this.pickRequiredArg(args, 'test_id')));

    handlers.suites_unshare = async (args = {}) =>
      this.asText(
        await this.apiClient.delete('shares/suites', this.pickRequiredArg(args, 'suite_id'))
      );
  },

  /**
   * Copy the selection args (e.g. test_ids/labels) into the payload, requiring at least
   * one of them — the API rejects a share request without a selection.
   */
  pickSelectionArgs(args = {}, keys, payload) {
    const provided = keys.filter((key) => {
      const value = args[key];
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });

    if (provided.length === 0) {
      throw new Error(`Provide at least one selection argument: ${keys.join(', ')}.`);
    }

    for (const key of provided) {
      payload[key] = args[key];
    }
    return provided;
  },
};
