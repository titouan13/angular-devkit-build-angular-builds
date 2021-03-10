"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypescriptWorkerPlugin = exports.getAotConfig = exports.getNonAotConfig = void 0;
const build_optimizer_1 = require("@angular-devkit/build-optimizer");
const core_1 = require("@angular-devkit/core");
const webpack_1 = require("@ngtools/webpack");
const path = require("path");
const environment_options_1 = require("../../utils/environment-options");
function canUseIvyPlugin(wco) {
    // Can only be used with Ivy
    if (!wco.tsConfig.options.enableIvy) {
        return false;
    }
    // Allow fallback to legacy build system via environment variable ('NG_BUILD_IVY_LEGACY=1')
    if (environment_options_1.legacyIvyPluginEnabled) {
        wco.logger.warn('"NG_BUILD_IVY_LEGACY" environment variable detected. Using legacy Ivy build system.');
        return false;
    }
    return true;
}
function createIvyPlugin(wco, aot, tsconfig) {
    const { buildOptions } = wco;
    const optimize = buildOptions.optimization.scripts;
    const compilerOptions = {
        sourceMap: buildOptions.sourceMap.scripts,
        declaration: false,
        declarationMap: false,
    };
    if (buildOptions.preserveSymlinks !== undefined) {
        compilerOptions.preserveSymlinks = buildOptions.preserveSymlinks;
    }
    const fileReplacements = {};
    if (buildOptions.fileReplacements) {
        for (const replacement of buildOptions.fileReplacements) {
            fileReplacements[core_1.getSystemPath(replacement.replace)] = core_1.getSystemPath(replacement.with);
        }
    }
    return new webpack_1.ivy.AngularWebpackPlugin({
        tsconfig,
        compilerOptions,
        fileReplacements,
        jitMode: !aot,
        emitNgModuleScope: !optimize,
        suppressZoneJsIncompatibilityWarning: true,
    });
}
function _pluginOptionsOverrides(buildOptions, pluginOptions) {
    const compilerOptions = {
        ...(pluginOptions.compilerOptions || {})
    };
    const hostReplacementPaths = {};
    if (buildOptions.fileReplacements) {
        for (const replacement of buildOptions.fileReplacements) {
            hostReplacementPaths[replacement.replace] = replacement.with;
        }
    }
    if (buildOptions.preserveSymlinks) {
        compilerOptions.preserveSymlinks = true;
    }
    return {
        ...pluginOptions,
        hostReplacementPaths,
        compilerOptions
    };
}
function _createAotPlugin(wco, options, i18nExtract = false) {
    const { root, buildOptions } = wco;
    const i18nInFile = buildOptions.i18nFile
        ? path.resolve(root, buildOptions.i18nFile)
        : undefined;
    const i18nFileAndFormat = i18nExtract
        ? {
            i18nOutFile: buildOptions.i18nFile,
            i18nOutFormat: buildOptions.i18nFormat,
        } : {
        i18nInFile: i18nInFile,
        i18nInFormat: buildOptions.i18nFormat,
    };
    const compilerOptions = options.compilerOptions || {};
    if (i18nExtract) {
        // Extraction of i18n is still using the legacy VE pipeline
        compilerOptions.enableIvy = false;
    }
    let pluginOptions = {
        mainPath: path.join(root, buildOptions.main),
        ...i18nFileAndFormat,
        locale: buildOptions.i18nLocale,
        platform: buildOptions.platform === 'server' ? webpack_1.PLATFORM.Server : webpack_1.PLATFORM.Browser,
        missingTranslation: buildOptions.i18nMissingTranslation,
        sourceMap: buildOptions.sourceMap.scripts,
        nameLazyFiles: buildOptions.namedChunks,
        forkTypeChecker: buildOptions.forkTypeChecker,
        logger: wco.logger,
        directTemplateLoading: true,
        ...options,
        compilerOptions,
        suppressZoneJsIncompatibilityWarning: true,
    };
    pluginOptions = _pluginOptionsOverrides(buildOptions, pluginOptions);
    return new webpack_1.AngularCompilerPlugin(pluginOptions);
}
function getNonAotConfig(wco) {
    const { tsConfigPath } = wco;
    const useIvyOnlyPlugin = canUseIvyPlugin(wco);
    return {
        module: {
            rules: [
                {
                    test: useIvyOnlyPlugin ? /\.[jt]sx?$/ : /\.tsx?$/,
                    loader: useIvyOnlyPlugin
                        ? webpack_1.ivy.AngularWebpackLoaderPath
                        : webpack_1.NgToolsLoader,
                },
            ],
        },
        plugins: [
            useIvyOnlyPlugin
                ? createIvyPlugin(wco, false, tsConfigPath)
                : _createAotPlugin(wco, { tsConfigPath, skipCodeGeneration: true }),
        ],
    };
}
exports.getNonAotConfig = getNonAotConfig;
function getAotConfig(wco, i18nExtract = false) {
    const { tsConfigPath, buildOptions } = wco;
    const optimize = buildOptions.optimization.scripts;
    const useIvyOnlyPlugin = canUseIvyPlugin(wco) && !i18nExtract;
    return {
        module: {
            rules: [
                {
                    test: useIvyOnlyPlugin ? /\.tsx?$/ : /(?:\.ngfactory\.js|\.ngstyle\.js|\.tsx?)$/,
                    use: [
                        ...(buildOptions.buildOptimizer
                            ? [
                                {
                                    loader: build_optimizer_1.buildOptimizerLoaderPath,
                                    options: { sourceMap: buildOptions.sourceMap.scripts },
                                },
                            ]
                            : []),
                        useIvyOnlyPlugin ? webpack_1.ivy.AngularWebpackLoaderPath : webpack_1.NgToolsLoader,
                    ],
                },
                // "allowJs" support with ivy plugin - ensures build optimizer is not run twice
                ...(useIvyOnlyPlugin
                    ? [
                        {
                            test: /\.jsx?$/,
                            use: [webpack_1.ivy.AngularWebpackLoaderPath],
                        },
                    ]
                    : []),
            ],
        },
        plugins: [
            useIvyOnlyPlugin
                ? createIvyPlugin(wco, true, tsConfigPath)
                : _createAotPlugin(wco, { tsConfigPath, emitClassMetadata: !optimize, emitNgModuleScope: !optimize }, i18nExtract),
        ],
    };
}
exports.getAotConfig = getAotConfig;
function getTypescriptWorkerPlugin(wco, workerTsConfigPath) {
    if (canUseIvyPlugin(wco)) {
        return createIvyPlugin(wco, false, workerTsConfigPath);
    }
    const { buildOptions } = wco;
    let pluginOptions = {
        skipCodeGeneration: true,
        tsConfigPath: workerTsConfigPath,
        mainPath: undefined,
        platform: webpack_1.PLATFORM.Browser,
        sourceMap: buildOptions.sourceMap.scripts,
        forkTypeChecker: buildOptions.forkTypeChecker,
        logger: wco.logger,
        // Run no transformers.
        platformTransformers: [],
    };
    pluginOptions = _pluginOptionsOverrides(buildOptions, pluginOptions);
    return new webpack_1.AngularCompilerPlugin(pluginOptions);
}
exports.getTypescriptWorkerPlugin = getTypescriptWorkerPlugin;
