/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { SemVer } from "semver";
import { App } from "./app";
import { versions } from '../models/versions/verions';

window.onload = async () => {

    // console.log(`edit: query = ${window.location.search}`);
    const query = App.decodeURLParams(window.location.search);

    const versionsJson: IVersions = {
        versions: []
    }
    const semversions = Object.fromEntries(Object.entries(versions))
    for (const key in semversions) {
        const value = semversions[key];
        if (!(value instanceof SemVer)) {
            continue
        }
        versionsJson.versions.push(value.version)
    }

    if (versionsJson.versions.indexOf(query['v']) === -1) {
        query['v'] = versionsJson.versions[versionsJson.versions.length - 1];
    }

    if (!query['c']) {
        query['c'] = '';
    }
    // console.log(`edit: query = ${query['edit']}`);
    // if(!query['edit']){
    //     query['edit'] = 'false';
    // }

    App.ChangeSkillTreeVersion(query['v'], query['c'], window.location.hash, `${query['edit'] === 'true'}`);
    new App().launch(query['v'], query['c'], versionsJson, query['edit'] === 'true');
};