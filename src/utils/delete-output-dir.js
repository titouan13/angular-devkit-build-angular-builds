"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOutputDir = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Delete an output directory, but error out if it's the root of the project.
 */
function deleteOutputDir(root, outputPath) {
    const resolvedOutputPath = path_1.resolve(root, outputPath);
    if (resolvedOutputPath === root) {
        throw new Error('Output path MUST not be project root directory!');
    }
    fs_1.rmdirSync(resolvedOutputPath, { recursive: true, maxRetries: 3 });
}
exports.deleteOutputDir = deleteOutputDir;
