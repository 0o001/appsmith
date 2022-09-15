// Workers do not have access to log.error
/* eslint-disable no-console */
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  DependencyMap,
  EVAL_WORKER_ACTIONS,
  EvalError,
  EvalErrorTypes,
} from "utils/DynamicBindingUtils";
import {
  CrashingError,
  DataTreeDiff,
  getSafeToRenderDataTree,
  removeFunctions,
  validateWidgetProperty,
} from "./evaluationUtils";
import DataTreeEvaluator from "workers/DataTreeEvaluator";
import ReplayEntity from "entities/Replay";
import evaluate, {
  evaluateAsync,
  setupEvaluationEnvironment,
} from "workers/evaluate";
import ReplayCanvas from "entities/Replay/ReplayEntity/ReplayCanvas";
import ReplayEditor from "entities/Replay/ReplayEntity/ReplayEditor";
import { setFormEvaluationSaga } from "./formEval";
import { isEmpty } from "lodash";
import { EvalMetaUpdates } from "./DataTreeEvaluator/types";
import { newLibraries } from "./Lint/utils";
import { UserLogObject } from "./UserLog";

const CANVAS = "canvas";

const ctx: Worker = self as any;

const window: Worker = self as any;

export let dataTreeEvaluator: DataTreeEvaluator | undefined;

let replayMap: Record<string, ReplayEntity<any>>;

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function messageEventListener(
  fn: (
    message: EVAL_WORKER_ACTIONS,
    requestData: any,
    requestId: string,
  ) => any,
) {
  return async (e: MessageEvent) => {
    const startTime = performance.now();
    const { method, requestData, requestId } = e.data;
    if (method) {
      const responseData = await fn(method, requestData, requestId);
      if (responseData) {
        const endTime = performance.now();
        try {
          ctx.postMessage({
            requestId,
            responseData,
            timeTaken: (endTime - startTime).toFixed(2),
          });
        } catch (e) {
          console.error(e);
          // we dont want to log dataTree because it is huge.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { dataTree, ...rest } = requestData;
          ctx.postMessage({
            requestId,
            responseData: {
              errors: [
                {
                  type: EvalErrorTypes.CLONE_ERROR,
                  message: (e as Error)?.message,
                  context: JSON.stringify(rest),
                },
              ],
            },
            timeTaken: (endTime - startTime).toFixed(2),
          });
        }
      }
    }
  };
}

ctx.addEventListener(
  "message",
  messageEventListener(async (method, requestData: any, requestId) => {
    switch (method) {
      case EVAL_WORKER_ACTIONS.SETUP: {
        setupEvaluationEnvironment();
        return true;
      }
      case EVAL_WORKER_ACTIONS.EVAL_TREE: {
        const {
          allActionValidationConfig,
          shouldReplay = true,
          theme,
          unevalTree,
          widgets,
          widgetTypeConfigMap,
        } = requestData;

        let dataTree: DataTree = unevalTree;
        let errors: EvalError[] = [];
        let logs: any[] = [];
        let userLogs: UserLogObject[] = [];
        let dependencies: DependencyMap = {};
        let evaluationOrder: string[] = [];
        let unEvalUpdates: DataTreeDiff[] | null = null;
        let jsUpdates: Record<string, any> = {};
        let evalMetaUpdates: EvalMetaUpdates = [];
        let isCreateFirstTree = false;
        try {
          if (!dataTreeEvaluator) {
            replayMap = replayMap || {};
            replayMap[CANVAS] = new ReplayCanvas({ widgets, theme });
            //allActionValidationConfigs maybe empty
            dataTreeEvaluator = new DataTreeEvaluator(
              widgetTypeConfigMap,
              allActionValidationConfig,
            );
            const dataTreeResponse = dataTreeEvaluator.createFirstTree(
              unevalTree,
            );
            isCreateFirstTree = true;
            evaluationOrder = dataTreeEvaluator.sortedDependencies;
            dataTree = dataTreeResponse.evalTree;
            jsUpdates = dataTreeResponse.jsUpdates;
            // We need to clean it to remove any possible functions inside the tree.
            // If functions exist, it will crash the web worker
            dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
          } else if (dataTreeEvaluator.hasCyclicalDependency) {
            if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
              //allActionValidationConfigs may not be set in dataTreeEvaluatior. Therefore, set it explicitly via setter method
              dataTreeEvaluator.setAllActionValidationConfig(
                allActionValidationConfig,
              );
            }
            if (shouldReplay) {
              replayMap[CANVAS]?.update({ widgets, theme });
            }
            dataTreeEvaluator = new DataTreeEvaluator(
              widgetTypeConfigMap,
              allActionValidationConfig,
            );
            if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
              dataTreeEvaluator.setAllActionValidationConfig(
                allActionValidationConfig,
              );
            }
            const dataTreeResponse = dataTreeEvaluator.createFirstTree(
              unevalTree,
            );
            isCreateFirstTree = true;
            evaluationOrder = dataTreeEvaluator.sortedDependencies;
            dataTree = dataTreeResponse.evalTree;
            jsUpdates = dataTreeResponse.jsUpdates;
            dataTree = dataTree && JSON.parse(JSON.stringify(dataTree));
          } else {
            if (dataTreeEvaluator && !isEmpty(allActionValidationConfig)) {
              dataTreeEvaluator.setAllActionValidationConfig(
                allActionValidationConfig,
              );
            }
            dataTree = {};
            if (shouldReplay) {
              replayMap[CANVAS]?.update({ widgets, theme });
            }
            const updateResponse = dataTreeEvaluator.updateDataTree(unevalTree);
            evaluationOrder = updateResponse.evaluationOrder;
            unEvalUpdates = updateResponse.unEvalUpdates;
            dataTree = JSON.parse(JSON.stringify(dataTreeEvaluator.evalTree));
            jsUpdates = updateResponse.jsUpdates;
            // evalMetaUpdates can have moment object as value which will cause DataCloneError
            // hence, stringify and parse to avoid such errors
            evalMetaUpdates = JSON.parse(
              JSON.stringify(updateResponse.evalMetaUpdates),
            );
          }
          dependencies = dataTreeEvaluator.inverseDependencyMap;
          errors = dataTreeEvaluator.errors;
          dataTreeEvaluator.clearErrors();
          logs = dataTreeEvaluator.logs;
          userLogs = dataTreeEvaluator.userLogs;
          if (replayMap[CANVAS]?.logs)
            logs = logs.concat(replayMap[CANVAS]?.logs);
          replayMap[CANVAS]?.clearLogs();
          dataTreeEvaluator.clearLogs();
        } catch (error) {
          if (dataTreeEvaluator !== undefined) {
            errors = dataTreeEvaluator.errors;
            logs = dataTreeEvaluator.logs;
            userLogs = dataTreeEvaluator.userLogs;
          }
          if (!(error instanceof CrashingError)) {
            errors.push({
              type: EvalErrorTypes.UNKNOWN_ERROR,
              message: (error as Error).message,
            });
            console.error(error);
          }
          dataTree = getSafeToRenderDataTree(unevalTree, widgetTypeConfigMap);
          unEvalUpdates = [];
        }
        return {
          dataTree,
          dependencies,
          errors,
          evaluationOrder,
          logs,
          unEvalUpdates,
          userLogs,
          jsUpdates,
          evalMetaUpdates,
          isCreateFirstTree,
        };
      }
      case EVAL_WORKER_ACTIONS.EVAL_ACTION_BINDINGS: {
        const { bindings, executionParams } = requestData;
        if (!dataTreeEvaluator) {
          return { values: undefined, errors: [] };
        }

        const values = dataTreeEvaluator.evaluateActionBindings(
          bindings,
          executionParams,
        );

        const cleanValues = removeFunctions(values);

        const errors = dataTreeEvaluator.errors;
        dataTreeEvaluator.clearErrors();
        return { values: cleanValues, errors };
      }
      case EVAL_WORKER_ACTIONS.EVAL_TRIGGER: {
        const {
          callbackData,
          dataTree,
          dynamicTrigger,
          globalContext,
        } = requestData;
        if (!dataTreeEvaluator) {
          return { triggers: [], errors: [] };
        }
        dataTreeEvaluator.updateDataTree(dataTree);
        const evalTree = dataTreeEvaluator.evalTree;
        const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;

        dataTreeEvaluator.evaluateTriggers(
          dynamicTrigger,
          evalTree,
          requestId,
          resolvedFunctions,
          callbackData,
          {
            globalContext,
          },
        );

        break;
      }
      case EVAL_WORKER_ACTIONS.PROCESS_TRIGGER:
        /**
         * This action will not be processed here. This is handled in the eval trigger sub steps
         * @link promisifyAction
         **/
        break;
      case EVAL_WORKER_ACTIONS.CLEAR_CACHE: {
        dataTreeEvaluator = undefined;
        return true;
      }
      case EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY: {
        const { property, props, validation, value } = requestData;
        return removeFunctions(
          validateWidgetProperty(validation, value, props, property),
        );
      }
      case EVAL_WORKER_ACTIONS.UNDO: {
        const { entityId } = requestData;
        if (!replayMap[entityId || CANVAS]) return;
        const replayResult = replayMap[entityId || CANVAS].replay("UNDO");
        replayMap[entityId || CANVAS].clearLogs();
        return replayResult;
      }
      case EVAL_WORKER_ACTIONS.REDO: {
        const { entityId } = requestData;
        if (!replayMap[entityId ?? CANVAS]) return;
        const replayResult = replayMap[entityId ?? CANVAS].replay("REDO");
        replayMap[entityId ?? CANVAS].clearLogs();
        return replayResult;
      }
      case EVAL_WORKER_ACTIONS.EXECUTE_SYNC_JS: {
        const { functionCall } = requestData;

        if (!dataTreeEvaluator) {
          return true;
        }
        const evalTree = dataTreeEvaluator.evalTree;
        const resolvedFunctions = dataTreeEvaluator.resolvedFunctions;
        const { errors, logs, result } = evaluate(
          functionCall,
          evalTree,
          resolvedFunctions,
          false,
          undefined,
        );
        return { errors, logs, result };
      }
      case EVAL_WORKER_ACTIONS.EVAL_EXPRESSION:
        const { expression, isTrigger } = requestData;
        const evalTree = dataTreeEvaluator?.evalTree;
        if (!evalTree) return {};
        // TODO find a way to do this for snippets
        return isTrigger
          ? evaluateAsync(expression, evalTree, "SNIPPET", {})
          : evaluate(expression, evalTree, {}, false);
      case EVAL_WORKER_ACTIONS.UPDATE_REPLAY_OBJECT:
        const { entity, entityId, entityType } = requestData;
        const replayObject = replayMap[entityId];
        if (replayObject) {
          replayObject.update(entity);
        } else {
          replayMap[entityId] = new ReplayEditor(entity, entityType);
        }
        break;
      case EVAL_WORKER_ACTIONS.SET_EVALUATION_VERSION:
        const { version } = requestData;
        self.evaluationVersion = version || 1;
        break;
      case EVAL_WORKER_ACTIONS.INIT_FORM_EVAL:
        const { currentEvalState, payload, type } = requestData;
        const response = setFormEvaluationSaga(type, payload, currentEvalState);
        return response;
      case EVAL_WORKER_ACTIONS.INSTALL_SCRIPT:
        try {
          let url = "";
          try {
            new URL(requestData);
            url = requestData;
          } catch (e) {
            url = `https://appsmith-packd.herokuapp.com/${requestData}`;
          }
          const oldKeys = Object.keys(self);
          try {
            //@ts-expect-error test
            self.importScripts(url);
          } catch (e) {
            await fetch(url)
              .then((res) => res.text())
              .then(
                function(text: string) {
                  eval(text);
                }.bind({ ...self, window }),
              );
          }
          // const text = await fetch(url).then((res) => res.());
          const newKeys = Object.keys(self);
          const latestKeys = newKeys.filter((key) => !oldKeys.includes(key));
          const accessor = latestKeys[latestKeys.length - 1];
          //@ts-expect-error test
          const entity = self[accessor];
          newLibraries.push(accessor);
          return {
            accessor,
            backupDefs: { [accessor]: generateDefs(entity) },
          };
        } catch (e) {
          console.log(e);
          return {
            error: `Installation failed. Appsmith cannot run this library`,
          };
        }
      default: {
        console.error("Action not registered on worker", method);
      }
    }
  }),
);

function generateDefs(obj: Record<string, any>) {
  const cachedObjs: any = [];
  const cachedValues: any = [];
  const def = {};
  const protoDef = {};
  function generate(obj: Record<string, any>, def: Record<string, any>) {
    const keys = Object.keys(obj);
    for (const key of keys) {
      const cached = cachedObjs.findIndex((c: any) => c == obj[key]);
      if (cached > -1) {
        def[key] = cachedValues[cached];
        continue;
      } else if (typeof obj[key] === "object") {
        def[key] = {};
        generate(obj[key], def[key]);
      } else if (typeof obj[key] === "function") {
        def[key] = {};
        generate(obj[key], def[key]);
      } else {
        def[key] = {
          "!type": getTernDocType(obj[key]),
        };
      }
      cachedObjs.push(obj[key]);
      cachedValues.push(def[key]);
    }
  }
  try {
    generate(obj, def);
    generate(obj.prototype, protoDef);
  } catch (e) {
    return Object.keys(obj || {}).reduce((acc, key) => {
      acc[key] = acc[key] || {};
      acc[key] = {
        "!type":
          typeof obj[key] === "function"
            ? "fn()"
            : typeof obj[key] === "boolean"
            ? "bool"
            : typeof obj[key],
      };
      return acc;
    }, {} as any);
  }
  return { ...def, prototype: protoDef };
}

function getTernDocType(obj: any) {
  const type = typeof obj;
  switch (type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "bool";
    case "undefined":
      return "?";
    case "function":
      return "fn()";
    default:
      return "?";
  }
}
