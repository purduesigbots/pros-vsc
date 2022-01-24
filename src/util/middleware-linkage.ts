import * as pros from '@purduesigbots/pros-cli-middleware';
import * as vscode from 'vscode';

import { ProgressNotification, NotificationMetadata } from './progress-notification';
import { output } from '../extension';

export type NotifyOutput = {
  text: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  notify_value: number;
  type: 'notify/progress' | 'notify/echo';
  pct?: number;
  simpleMessage?: string;
};

export const handleNotify =
  (notificationTrackerList: Array<NotificationMetadata>, echoOverrideFn?: (notificationTracker: NotificationMetadata, data: NotifyOutput) => void) =>
    ({d: data, /* output, kill */}: {d: NotifyOutput}) => {
      const notifyType = data.type.split('/')[1];
      
      let notificationTracker: NotificationMetadata | undefined;

      // HACK: CLI doesn't properly generate new notify_values for different
      //       progress bars so for now we'll just duplicate the logic used
      //       in the atom plugin that uses label text matching for deciding
      //       when to make a new entry in our list of current notifications
      const notificationPredicate = notifyType === 'progress' ?
        ({notification}: NotificationMetadata) => data.text === notification.title :
        ({id}: NotificationMetadata) => data.notify_value === id;
      
      if (!(notificationTracker = notificationTrackerList.find(notificationPredicate))) {
          notificationTrackerList.push(notificationTracker = {
          // use the next highest unused id for progress notifications otherwise
          // just use notify_value
          id: notifyType === 'progress' ?
            (notificationTrackerList.length ?
              Math.max(...notificationTrackerList.map(e => e.id)) + 1 : 0) :
            data.notify_value,
          notification: new ProgressNotification(data.text, false),
          totalProgress: 0,
        });

        // we've created the notifications as non-cancellable but we could
        // totally support that...
        // notificationTracker.notification.emitter.on('cancel', kill());
      }

      if (notifyType === 'progress') {
        notificationTracker.notification.notify(
          data.simpleMessage,
          // vscode wants increments but the CLI reports cumulative
          // so we need to calculate the increment from the last reported
          // progress percentage
          data.pct ? (notificationTracker.totalProgress - data.pct) * 100 : undefined
        );

        // update the cumulative value
        notificationTracker.totalProgress = data.pct || 0;
      } else {
        echoOverrideFn ?
          echoOverrideFn(notificationTracker, data) :
          notificationTracker.notification.notify(data.text);
      }
  };

export type FinalizeOutput<T> = {
  type: string;
  method: string;
  data: T;
  human: string;
};

export type FinalizeProjectReport = {
  project: {
    target: string;
    location: string;
    name: string;
    templates: Array<{
      name: string; version: string; origin: string;
    }>;
  };
};

export type FinalizeTemplateQuery = Array<{
  name: string;
  version: string;
  location: string;
  target: string;
  local: boolean;
}>;

export const handleFinalize = <T>({d: data, /* output, kill */}: {d: FinalizeOutput<T>}) => {
    vscode.window.showInformationMessage(data.human);
};

export type LogOutput = {
  type: string;
  level: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG';
  message: string;
  simpleMessage: string;
};

export const handleLog = (debug: boolean) => ({d: data, /* output, kill */}: {d: LogOutput}) => {
  if (data.level === 'ERROR' || data.level === 'CRITICAL') {
    vscode.window.showErrorMessage(data.simpleMessage);
    console.error(data);
  } else if (data.level === 'WARNING') {
    vscode.window.showWarningMessage(data.simpleMessage);
    console.warn(data);
  } else if (debug && data.level === 'DEBUG') {
    console.log(data);
  }
};

export const handlePrompt = ({d: data, /* output, kill */}: {d: any}) => {
  console.log(data);
};