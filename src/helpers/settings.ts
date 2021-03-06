/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/
"use strict";

import { workspace } from "vscode";
import { SettingNames, WitQueries } from "./constants";
import { Logger } from "../helpers/logger";

abstract class BaseSettings {
    protected readSetting<T>(name: string, defaultValue:T): T {
        let configuration = workspace.getConfiguration();
        let value = configuration.get<T>(name, undefined);

        // If user specified a value, use it
        if (value !== undefined && value !== null) {
            return value;
        }
        return defaultValue;
    }
}

export interface IPinnedQuery {
    queryText?: string;
    queryPath?: string;
    account: string;
}

export class PinnedQuerySettings extends BaseSettings {
    private _pinnedQuery: IPinnedQuery;
    private _account: string;

    constructor(account: string) {
        super();
        this._account = account;
        this._pinnedQuery = this.getPinnedQuery(account);
    }

    private getPinnedQuery(account: string) : IPinnedQuery {
        let pinnedQueries = this.readSetting<Array<IPinnedQuery>>(SettingNames.PinnedQueries, undefined);
        if (pinnedQueries !== undefined) {
            Logger.LogDebug("Found pinned queries in user configuration settings.");
            let global: IPinnedQuery = undefined;
            for (var index = 0; index < pinnedQueries.length; index++) {
                let element = pinnedQueries[index];
                if (element.account === account ||
                    element.account === account + ".visualstudio.com") {
                    return element;
                } else if (element.account === "global") {
                    global = element;
                }
            }
            if (global !== undefined) {
                Logger.LogDebug("No account-specific pinned query found, using global pinned query.");
                return global;
            }
        }
        Logger.LogDebug("No account-specific pinned query or global pinned query found. Using default.");
        return undefined;
    }

    public get PinnedQuery() : IPinnedQuery {
        return this._pinnedQuery || { account: this._account, queryText: WitQueries.MyWorkItems };
    }
}

export class AccountSettings extends BaseSettings {
    private _teamServicesPersonalAccessToken: string;

    constructor(account: string) {
        super();
        // Storing PATs by account in the configuration settings to make switching between accounts easier
        this._teamServicesPersonalAccessToken = this.getAccessToken(account);
    }

    private getAccessToken(account: string) : string {
        let tokens: any = this.readSetting<Array<any>>(SettingNames.AccessTokens, undefined);
        if (tokens !== undefined) {
            Logger.LogDebug("Found access tokens in user configuration settings.");
            let global: string = undefined;
            for (var index = 0; index < tokens.length; index++) {
                let element: any = tokens[index];
                if (element.account === account ||
                    element.account === account + ".visualstudio.com") {
                    return element.token;
                } else if (element.account === "global") {
                    global = element.token;
                }
            }
            if (global !== undefined) {
                Logger.LogDebug("No account-specific token found, using global token.");
                return global;
            }
        }
        Logger.LogDebug("No account-specific token or global token found.");
        return undefined;
    }

    public get TeamServicesPersonalAccessToken() : string {
        return this._teamServicesPersonalAccessToken;
    }
}

export class Settings extends BaseSettings {
    private _appInsightsEnabled: boolean;
    private _appInsightsKey: string;
    private _loggingLevel: string;
    private _pollingInterval: number;

    constructor() {
        super();

        let loggingLevel = SettingNames.LoggingLevel;
        this._loggingLevel = this.readSetting<string>(loggingLevel, undefined);

        let pollingInterval = SettingNames.PollingInterval;
        this._pollingInterval = this.readSetting<number>(pollingInterval, 5);
        Logger.LogDebug("Polling interval value (minutes): " + this._pollingInterval.toString());
        // Ensure a minimum value when an invalid value is set
        if (this._pollingInterval <= 0) {
            Logger.LogDebug("Negative polling interval provided.  Setting to default.");
            this._pollingInterval = 5;
        }

        this._appInsightsEnabled = this.readSetting<boolean>(SettingNames.AppInsightsEnabled, true);
        this._appInsightsKey = this.readSetting<string>(SettingNames.AppInsightsKey, undefined);
    }

    public get AppInsightsEnabled(): boolean {
        return this._appInsightsEnabled;
    }

    public get AppInsightsKey(): string {
        return this._appInsightsKey;
    }

    public get LoggingLevel(): string {
        return this._loggingLevel;
    }

    public get PollingInterval(): number {
        return this._pollingInterval;
    }
}
