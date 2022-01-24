import * as vscode from 'vscode';
import { EventEmitter } from 'events';

export class ProgressNotification {
  location: vscode.ProgressLocation = vscode.ProgressLocation.Notification;
  title: string;
  cancellable?: boolean;
  
  promise: Thenable<void>;
  emitter: EventEmitter;
  
  private _hasSubscribedToEmitter: boolean = false;
  
  constructor(title: string, cancellable?: boolean) {
    this.title = title;
    this.cancellable = cancellable;
    this.emitter = new EventEmitter();
    this.promise = vscode.window.withProgress({
      location: this.location,
      title: this.title,
      cancellable: this.cancellable
    }, async (progress, token) => {
      if (token.isCancellationRequested) {
        this.emitter.emit('cancel');
      }
      
      if (!this._hasSubscribedToEmitter) {
        this.emitter.on('notify', (message?: string, increment?: number) => {
          progress.report({message, increment});
        });
        this._hasSubscribedToEmitter = true;
      }
    });
  }
  
  notify(message?: string, increment?: number) {
    this.emitter?.emit('notify', message, increment);
  }
}

export type NotificationMetadata = {
  id: number;
  notification: ProgressNotification;
  totalProgress: number;
};