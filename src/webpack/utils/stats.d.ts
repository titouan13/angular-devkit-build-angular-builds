/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { logging } from '@angular-devkit/core';
import { WebpackLoggingCallback } from '@angular-devkit/build-webpack';
export declare function formatSize(size: number): string;
export declare function generateBundleStats(info: {
    id: string | number;
    size?: number;
    files: string[];
    names?: string[];
    entry: boolean;
    initial: boolean;
    rendered?: boolean;
}, colors: boolean): string;
export declare function generateBuildStats(hash: string, time: number, colors: boolean): string;
export declare function statsToString(json: any, statsConfig: any): string;
export declare function statsWarningsToString(json: any, statsConfig: any): string;
export declare function statsErrorsToString(json: any, statsConfig: any): string;
export declare function statsHasErrors(json: any): boolean;
export declare function statsHasWarnings(json: any): boolean;
export declare function createWebpackLoggingCallback(verbose: boolean, logger: logging.LoggerApi): WebpackLoggingCallback;
