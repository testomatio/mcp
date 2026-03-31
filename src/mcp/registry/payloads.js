export const payloadMethods = {
  async createWrapped(resource, wrapperKey, payload) {
    const wrappedBody = { [wrapperKey]: payload };
    try {
      return await this.apiClient.create(resource, payload);
    } catch (error) {
      if (!this.shouldRetryWrappedBody(error, wrapperKey)) {
        throw error;
      }
      return this.apiClient.create(resource, wrappedBody);
    }
  },

  async updateWrapped(resource, id, wrapperKey, payload) {
    const wrappedBody = { [wrapperKey]: payload };
    try {
      return await this.apiClient.update(resource, id, payload);
    } catch (error) {
      if (!this.shouldRetryWrappedBody(error, wrapperKey)) {
        throw error;
      }
      return this.apiClient.update(resource, id, wrappedBody);
    }
  },

  buildTestPayload({
    title,
    suite_id: suiteId,
    description,
    emoji,
    priority,
    assigned_to: assignedTo,
    code,
    state,
    sync,
    link,
  } = {}) {
    return {
      title,
      suite_id: suiteId,
      description,
      emoji,
      priority,
      assigned_to: assignedTo,
      code,
      state,
      sync,
      link,
    };
  },

  buildSuitePayload({
    title,
    description,
    emoji,
    parent_id: parentId,
    file_type: fileType,
    assigned_to: assignedTo,
    file,
    children,
    link,
  } = {}) {
    return {
      title,
      description,
      emoji,
      parent_id: parentId,
      file_type: fileType,
      assigned_to: assignedTo,
      file,
      children,
      link,
    };
  },

  buildRunCreatePayload({
    title,
    description,
    plan_id: planId,
    kind,
    rungroup_id: rungroupId,
    env,
    assigned_to: assignedTo,
    assign_strategy: assignStrategy,
    test_ids: testIds,
    suite_ids: suiteIds,
    envs,
    configuration,
    link,
  } = {}) {
    return {
      title,
      description,
      plan_id: planId,
      kind,
      rungroup_id: rungroupId,
      env,
      assigned_to: assignedTo,
      assign_strategy: assignStrategy,
      test_ids: testIds,
      suite_ids: suiteIds,
      envs,
      configuration,
      link,
    };
  },

  buildRunUpdatePayload({
    title,
    description,
    plan_id: planId,
    kind,
    rungroup_id: rungroupId,
    env,
    status_event: statusEvent,
    assigned_to: assignedTo,
    assign_strategy: assignStrategy,
    test_ids: testIds,
    suite_ids: suiteIds,
    configuration,
    link,
  } = {}) {
    return {
      title,
      description,
      plan_id: planId,
      kind,
      rungroup_id: rungroupId,
      env,
      status_event: statusEvent,
      assigned_to: assignedTo,
      assign_strategy: assignStrategy,
      test_ids: testIds,
      suite_ids: suiteIds,
      configuration,
      link,
    };
  },

  async createRunWithFallback(args = {}) {
    const payload = this.buildRunCreatePayload(args);
    try {
      return await this.apiClient.create('runs', payload);
    } catch (error) {
      if (!this.shouldRetryWrappedBody(error, 'run')) {
        throw error;
      }
      return this.apiClient.create('runs', { run: payload });
    }
  },

  async updateRunWithFallback(runId, args = {}) {
    const payload = this.buildRunUpdatePayload(args);
    try {
      return await this.apiClient.update('runs', runId, payload);
    } catch (error) {
      if (!this.shouldRetryWrappedBody(error, 'run')) {
        throw error;
      }
      return this.apiClient.update('runs', runId, { run: payload });
    }
  },

  shouldRetryWrappedBody(error, wrapperKey) {
    if (!error || ![400, 422].includes(error.status)) {
      return false;
    }
    const payload = error.payload || {};
    const blob = JSON.stringify(payload).toLowerCase();
    const key = wrapperKey.toLowerCase();

    const mentionsMissingParam =
      blob.includes('param is missing') ||
      blob.includes('missing required') ||
      blob.includes('is required');

    return blob.includes(key) && mentionsMissingParam;
  },

  buildTestrunPayload({
    run_id: runId,
    test_id: testId,
    status,
    message,
    run_time: runTime,
    assigned_to: assignedTo,
    test_title: testTitle,
    automated,
  } = {}) {
    return {
      run_id: runId,
      test_id: testId,
      status,
      message,
      run_time: runTime,
      assigned_to: assignedTo,
      test_title: testTitle,
      automated,
    };
  },

  buildRungroupPayload({
    title,
    description,
    emoji,
    kind,
    pin,
    status,
    parent_id: parentId,
    children,
  } = {}) {
    return {
      title,
      description,
      emoji,
      kind,
      pin,
      status,
      parent_id: parentId,
      children,
    };
  },

  buildStepPayload({ title, description, link } = {}) {
    return {
      title,
      description,
      link,
    };
  },

  buildSnippetPayload({ title, description, link } = {}) {
    return {
      title,
      description,
      link,
    };
  },

  buildLabelPayload({ title, color, visibility, scope, field } = {}) {
    return {
      title,
      color,
      visibility,
      scope,
      field,
    };
  },

  buildPlanPayload({
    title,
    description,
    kind,
    hidden,
    as_manual: asManual,
    test_plan: testPlan,
    link,
  } = {}) {
    return {
      title,
      description,
      kind,
      hidden,
      as_manual: asManual,
      test_plan: testPlan,
      link,
    };
  },
};
