﻿import '../content/app.css';

import { SkillTreeData } from "../models/SkillTreeData";
import { SkillTreeEvents } from "../models/SkillTreeEvents";
import { ISkillTreeRenderer } from '../models/types/ISkillTreeRenderer';
import { PIXISkillTreeRenderer } from '../models/PIXISkillTreeRenderer';
import * as download from 'downloadjs';
import { SkillTreeAlternate } from '../models/SkillTreeAlternate';
import { SkillTreeUtilities } from '../models/SkillTreeUtilities';

namespace App {
    let skillTreeData: SkillTreeData;
    let skillTreeData_compare: SkillTreeData | undefined;
    let skillTreeAlternate: SkillTreeAlternate;
    let skillTreeUtilities: SkillTreeUtilities;
    let renderer: ISkillTreeRenderer;

    export const main = async (version: string, version_compare: string) => {
        renderer = new PIXISkillTreeRenderer();
        for (let i of [version, version_compare]) {
            if (i === '') {
                continue;
            }

            let options: ISkillTreeOptions = await fetch(`data/${i}/Opts.json`).then(response => response.json());
            let data = new SkillTreeData(await fetch(`data/${i}/SkillTree.json`).then(response => response.json()), options);

            if (i === version) {
                skillTreeData = data;
                skillTreeAlternate = new SkillTreeAlternate(await fetch(`data/${i}/SkillTreeAlternate.json`).then(response => response.ok ? response.json() : undefined));
            }

            if (i === version_compare) {
                skillTreeData_compare = data;
            }
        }
        skillTreeUtilities = new SkillTreeUtilities(skillTreeData, skillTreeAlternate);

        fetch(`data/versions.json?t=${(new Date()).getTime()}`).then(response => {
            return response.json();
        }).then((json: IVersions) => {
            var versionSelect = <HTMLSelectElement>document.getElementById("skillTreeControl_Version")
            var compareSelect = <HTMLSelectElement>document.getElementById("skillTreeControl_VersionCompare");
            for (var ver of json.versions) {
                let v = document.createElement("option");
                v.text = v.value = ver;
                if (ver === version) {
                    v.setAttribute('selected', 'selected');
                }
                versionSelect.appendChild(v);

                let c = document.createElement("option");
                c.text = c.value = ver;
                if (ver === version_compare) {
                    c.setAttribute('selected', 'selected');
                }
                compareSelect.appendChild(c);
            }

            let controls = <HTMLCollectionOf<HTMLDivElement>>document.getElementsByClassName("skillTreeVersions");
            for (let i in controls) {
                if (controls[i].style !== undefined) {
                    controls[i].style.removeProperty('display');
                }
            }

            var go = <HTMLSelectElement>document.getElementById("skillTreeControl_VersionGo");
            go.addEventListener("click", () => {
                var search = '?';
                if (versionSelect.value !== '0') {
                    search += `v=${versionSelect.value}`;
                }

                if (!search.endsWith('?') && compareSelect.value !== '0') search += '&';

                if (compareSelect.value !== '0') {
                    search += `c=${compareSelect.value}`;
                }

                window.location.search = search;
            });
        });

        let container = document.getElementById("skillTreeContainer");
        if (container !== null) {
            renderer.Initialize(container, skillTreeData, skillTreeAlternate, skillTreeData_compare)
                .then(() => {
                    SetupEventsAndControls();
                    renderer.RenderBase();
                    skillTreeUtilities.decodeURL();
                    renderer.RenderCharacterStartsActive();

                    var screenshot = <HTMLSelectElement>document.getElementById("skillTreeControl_Screenshot");
                    screenshot.style.removeProperty('display');
                    screenshot.addEventListener("click", () => {
                        let mimeType: 'image/jpeg' = 'image/jpeg';
                        download(renderer.CreateScreenshot(mimeType), `${version.replace(/\./g, '')}_skilltree.jpg`, mimeType);
                    });
                })
                .catch((reason) => alert(`There was an issue initializing the renderer\n${reason}`));
        }
    }

    let SetupEventsAndControls = () => {
        SkillTreeEvents.on("skilltree", "highlighted-nodes-update", renderer.RenderHighlight);
        SkillTreeEvents.on("skilltree", "class-change", renderer.RenderCharacterStartsActive);

        SkillTreeEvents.on("skilltree", "hovered-nodes-start", renderer.StartRenderHover);
        SkillTreeEvents.on("skilltree", "hovered-nodes-end", renderer.StopRenderHover);
        SkillTreeEvents.on("skilltree", "active-nodes-update", renderer.RenderActive);

        SkillTreeEvents.on("skilltree", "normal-node-count", (count: number) => { let e = document.getElementById("skillTreeNormalNodeCount"); if (e !== null) e.innerHTML = count.toString(); });
        SkillTreeEvents.on("skilltree", "normal-node-count-maximum", (count: number) => { let e = document.getElementById("skillTreeNormalNodeCountMaximum"); if (e !== null) e.innerHTML = count.toString(); });
        SkillTreeEvents.on("skilltree", "ascendancy-node-count", (count: number) => { let e = document.getElementById("skillTreeAscendancyNodeCount"); if (e !== null) e.innerHTML = count.toString(); });
        SkillTreeEvents.on("skilltree", "ascendancy-node-count-maximum", (count: number) => { let e = document.getElementById("skillTreeAscendancyNodeCountMaximum"); if (e !== null) e.innerHTML = count.toString(); });

        SkillTreeEvents.on("skilltree", "jewel-click-start", showJewelPopup);

        populateStartClasses(<HTMLSelectElement>document.getElementById("skillTreeControl_Class"));
        bindSearchBox(<HTMLInputElement>document.getElementById("skillTreeControl_Search"));
        let controls = <HTMLCollectionOf<HTMLDivElement>>document.getElementsByClassName("skillTreeControls");
        for (let i in controls) {
            if (controls[i].style !== undefined) {
                controls[i].style.removeProperty('display');
            }
        }

        let points = <HTMLCollectionOf<HTMLDivElement>>document.getElementsByClassName("skillTreePoints");
        for (let i in points) {
            if (points[i].style !== undefined) {
                points[i].style.removeProperty('display');
            }
        }
    }

    let seedTimeout: number | null = null;
    let showJewelPopup = (settings: ISkillTreeAlternateJewelSettings) => {
        let sizeSelect = <HTMLSelectElement>document.getElementById("skillTreeJewelPopupSize");
        let factionSelect = <HTMLSelectElement>document.getElementById("skillTreeJewelPopupFaction");
        let nameSelect = <HTMLSelectElement>document.getElementById("skillTreeJewelPopupName");
        let seedInput = <HTMLInputElement>document.getElementById("skillTreeJewelPopupSeed");
        let factionDiv = <HTMLDivElement>document.getElementById('skillTreeJewelPopupFactionRequired');

        if (factionSelect.children.length === 0) {
            for (let i in skillTreeAlternate.factions) {
                let o = document.createElement('option');
                o.value = i;
                o.text = skillTreeAlternate.factions[i].name;
                factionSelect.appendChild(o);
            }
        }

        if (settings.size !== undefined) {
            sizeSelect.value = settings.size;
        }

        if (settings.factionId !== undefined) {
            factionSelect.value = settings.factionId.toString();
        }

        if (settings.seed !== undefined) {
            seedInput.value = settings.seed;
        }

        if (settings.name !== undefined) {
            nameSelect.value = settings.name;
        }

        let _onchange = () => {
            if (factionDiv !== null) {
                if (factionSelect.value !== "0") {
                    factionDiv.style.removeProperty('display');
                    sizeSelect.value = "Large";
                    sizeSelect.disabled = true;
                } else {
                    factionDiv.style.setProperty('display', 'none');
                    sizeSelect.disabled = false;
                }
            }

            if (skillTreeAlternate.alternate_tree_keystones[+factionSelect.value] === undefined || !(nameSelect.value in skillTreeAlternate.alternate_tree_keystones[+factionSelect.value])) {
                while (nameSelect.firstChild) {
                    nameSelect.removeChild(nameSelect.firstChild);
                }
            }

            if (nameSelect.children.length === 0) {
                for (let i in skillTreeAlternate.alternate_tree_keystones[+factionSelect.value]) {
                    let o = document.createElement('option');
                    o.value = i;
                    o.text = i;
                    nameSelect.appendChild(o);
                }
            }

            SkillTreeEvents.fire("skilltree", "jewel-click-end",
                <ISkillTreeAlternateJewelSettings>{
                    node_id: settings.node_id,
                    size: sizeSelect.value,
                    factionId: sizeSelect.value !== "None" ? +factionSelect.value : 0,
                    seed: seedInput.value,
                    name: nameSelect.value
                });
        };

        _onchange();
        factionSelect.onchange = _onchange;
        sizeSelect.onchange = _onchange;
        nameSelect.onchange = _onchange;
        seedInput.onkeyup = () => {
            if (seedTimeout !== null) {
                clearTimeout(seedTimeout);
            }

            seedTimeout = setTimeout(_onchange, 250);
        };

        let popup = <HTMLDivElement>document.getElementById("skillTreeJewelPopup");
        popup.style.removeProperty('display');
        let button = <HTMLButtonElement>document.getElementById("skillTreeJewelPopupOk");
        button.onclick = () => {
            popup.style.setProperty('display', 'none');
            _onchange();
        };
    }

    let populateStartClasses = (classControl: HTMLSelectElement) => {
        while (classControl.firstChild) {
            classControl.removeChild(classControl.firstChild);
        }

        let options = new Array<HTMLOptionElement>();
        for (let id in skillTreeData.classStartNodes) {
            let node = skillTreeData.nodes[id];

            let e = document.createElement("option");
            e.text = skillTreeData.constants.classIdToName[node.spc[0]];
            e.value = node.spc[0].toString();

            if (node.spc[0] === skillTreeData.getStartClass()) {
                e.setAttribute("selected", "selected");
            }
            options.push(e);
        }

        options.sort((a, b) => {
            let first = a.value;
            let second = b.value;
            if (first !== null && second !== null) {
                return +first - +second;
            }
            return 0;
        });

        for (var e of options) {
            classControl.append(e);
        }

        let ascControl = <HTMLSelectElement>document.getElementById("skillTreeControl_Ascendancy");
        classControl.onchange = () => {
            let val = classControl.value;
            SkillTreeEvents.fire("controls", "class-change", +val);
            if (ascControl !== null) {
                populateAscendancyClasses(ascControl, +val, 0);
            }
        };

        if (ascControl !== null) {
            populateAscendancyClasses(ascControl);
        }
    }

    let populateAscendancyClasses = (ascControl: HTMLSelectElement, start: number | undefined = undefined, startasc: number | undefined = undefined) => {
        while (ascControl.firstChild) {
            ascControl.removeChild(ascControl.firstChild);
        }

        if (!skillTreeData.skillTreeOptions.ascClasses) {
            ascControl.style.display = "none";
            let e = (<HTMLDivElement>document.getElementById("skillTreeAscendancy"));
            if (e !== null) e.style.display = "none";
            return;
        }

        let ascStart = startasc !== undefined ? startasc : skillTreeData.getAscendancyClass();
        let none = document.createElement("option");
        none.text = "None";
        none.value = "0";
        if (ascStart === 0) {
            none.setAttribute("selected", "selected");
        }
        ascControl.append(none);

        let startClass = start !== undefined ? start : skillTreeData.getStartClass();
        for (let ascid in skillTreeData.skillTreeOptions.ascClasses[startClass].classes) {
            let asc = skillTreeData.skillTreeOptions.ascClasses[startClass].classes[ascid];

            let e = document.createElement("option");
            e.text = asc.displayName;
            e.value = ascid;

            if (+ascid === ascStart) {
                e.setAttribute("selected", "selected");
            }
            ascControl.append(e);
        }

        ascControl.onchange = () => {
            let val = ascControl.value;
            SkillTreeEvents.fire("controls", "ascendancy-class-change", +val);
        };
    }

    let searchTimout: number | null = null;
    let bindSearchBox = (searchControl: HTMLInputElement) => {
        searchControl.onkeyup = () => {
            if (searchTimout !== null) {
                clearTimeout(searchTimout);
            }
            searchTimout = setTimeout(() => {
                SkillTreeEvents.fire("controls", "search-change", searchControl.value);
                searchTimout = null;
            }, 250);
        };
    }

    export const decodeURLParams = (search = ''): { [id: string]: string } => {
        const hashes = search.slice(search.indexOf("?") + 1).split("&");
        return hashes.reduce((params, hash) => {
            const split = hash.indexOf("=");

            if (split < 0) {
                return Object.assign(params, {
                    [hash]: null
                });
            }

            const key = hash.slice(0, split);
            const val = hash.slice(split + 1);

            return Object.assign(params, { [key]: decodeURIComponent(val) });
        }, {});
    };
}

window.onload = () => {
    var query = App.decodeURLParams(window.location.search);
    if (!query['v']) {
        query['v'] = '3.7.0';
    }
    if (!query['c']) {
        query['c'] = '';
    }
    App.main(query['v'], query['c']);
};