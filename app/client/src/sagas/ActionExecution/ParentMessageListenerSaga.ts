import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  SubscribeParentDescription,
  UnsubscribeParentDescription,
} from "@appsmith/entities/DataTree/actionTriggers";
import { Channel, channel, Task } from "redux-saga";
import { call, take, spawn, cancel } from "redux-saga/effects";
import {
  executeAppAction,
  TriggerMeta,
} from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import { logActionExecutionError } from "./errorUtils";

interface MessageChannelPayload {
  callbackString: string;
  callbackData: unknown;
  eventType: EventType;
  triggerMeta: TriggerMeta;
}

const subscriptionsMap = new Map<
  string,
  {
    windowListenerUnSubscribe: () => void;
    spawnedTask: Task;
    triggerMeta: TriggerMeta;
  }
>();

function* messageChannelHandler(channel: Channel<MessageChannelPayload>) {
  try {
    while (true) {
      const payload: MessageChannelPayload = yield take(channel);
      const { callbackData, callbackString, eventType, triggerMeta } = payload;
      yield call(executeAppAction, {
        dynamicString: callbackString,
        callbackData: [callbackData],
        event: { type: eventType },
        triggerPropertyName: triggerMeta.triggerPropertyName,
        source: triggerMeta.source,
      });
    }
  } finally {
    channel.close();
  }
}

export function* listenToParentMessages(
  actionPayload: SubscribeParentDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  const existingSubscription = subscriptionsMap.get(
    actionPayload.acceptedOrigin,
  );
  if (existingSubscription) {
    logActionExecutionError(
      `Already listening to ${actionPayload.acceptedOrigin}. 
      ${
        existingSubscription.triggerMeta.source?.name &&
        existingSubscription.triggerMeta.triggerPropertyName
          ? `${existingSubscription.triggerMeta.source?.name} -> ${existingSubscription.triggerMeta.triggerPropertyName}`
          : ""
      }`,
      triggerMeta.source,
      triggerMeta.triggerPropertyName,
    );
    return;
  }

  const messageChannel = channel<MessageChannelPayload>();
  const spawnedTask: Task = yield spawn(messageChannelHandler, messageChannel);

  const messageHandler = (event: MessageEvent) => {
    if (event.currentTarget !== window) return;
    if (event.type !== "message") return;
    if (
      actionPayload.acceptedOrigin !== "*" &&
      event.origin !== actionPayload.acceptedOrigin
    )
      return;

    messageChannel.put({
      callbackString: actionPayload.callbackString,
      callbackData: event.data,
      eventType,
      triggerMeta,
    });
  };

  window.addEventListener("message", messageHandler);

  subscriptionsMap.set(actionPayload.acceptedOrigin, {
    windowListenerUnSubscribe: () =>
      window.removeEventListener("message", messageHandler),
    spawnedTask,
    triggerMeta,
  });
}

export function* unsubscribeParentMessages(
  actionPayload: UnsubscribeParentDescription["payload"],
  triggerMeta?: TriggerMeta,
) {
  if (actionPayload.origin === "*") {
    for (const [, value] of subscriptionsMap) {
      value.windowListenerUnSubscribe();
      yield cancel(value.spawnedTask);
    }
    subscriptionsMap.clear();
  } else {
    const existingSubscription = subscriptionsMap.get(actionPayload.origin);
    if (!existingSubscription) {
      logActionExecutionError(
        `No subcriptions to ${actionPayload.origin}`,
        triggerMeta?.source,
        triggerMeta?.triggerPropertyName,
      );
      return;
    }

    existingSubscription.windowListenerUnSubscribe();
    yield cancel(existingSubscription.spawnedTask);
    subscriptionsMap.delete(actionPayload.origin);
  }
}
