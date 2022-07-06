/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, AlphaMode, AssetContainer, AttachPoint, ButtonBehavior, ColliderType, CollisionLayer, Color3, Color4, Context, Guid, ParameterSet, ScaledTransformLike, User } from "@microsoft/mixed-reality-extension-sdk";
import { CigarOptions } from "./cigar";
import { Player } from "./player";
import { fetchJSON, translate } from "./utils";

const MIN_SYNC_INTERVAL = 1;

const DEFAULT_CIGARS = [
        {
                name: 'cigar',
                attachPoint: 'right-hand',
                resourceId: 'artifact:2040220300980781199',
                transform: {
                        position: {
                                x: -0.024,
                                y: 0.1,
                                z: 0.115
                        },
                        rotation: {
                                x: -90,
                                y: 0,
                                z: 0
                        }
                },
                model: {
                        transform: {
                                position: {
                                        x: -0.0004,
                                        y: 0.017,
                                        z: -0.0607
                                },
                                rotation: {
                                        x: -9.973,
                                        y: 0,
                                        z: 0
                                }
                        },
                },
                smoke: {
                        resourceId: "artifact:2040220300586516620",
                        transform: {
                                position: {
                                        x: 0,
                                        y: 0,
                                        z: 0.05
                                }
                        }
                },
                inhale: {
                        resourceId: "artifact:2040220301114998928",
                        duration: 4,
                },
                exhale: {
                        resourceId: "artifact:2040220301240828049",
                        transform: {
                                position: {
                                        x: 0.00039,
                                        y: -0.091,
                                        z: 0.131
                                }
                        },
                        duration: 4,
                },
                trigger: {
                        transform: {
                                position: {
                                        x: -0.024, y: -0.0003, z: 0.115
                                },
                                rotation: {
                                        x: 0, y: 0, z: 0
                                },
                        },
                        dimensions: {
                                width: 0.04,
                                height: 0.04,
                                depth: 0.04
                        }
                },
                tip: {
                        transform: {
                                position: {
                                        x: -0.024, y: 0.137, z: 0.115
                                },
                                rotation: {
                                        x: 0, y: 0, z: 0
                                },
                        },
                        dimensions: {
                                width: 0.04,
                                height: 0.04,
                                depth: 0.04
                        }
                },
        },
        {
                name: 'cigarette',
                attachPoint: 'right-hand',
                resourceId: 'artifact:2040291269854364362',
                transform: {
                        position: {
                                x: -0.0196,
                                y: 0.059,
                                z: 0.1041
                        },
                        rotation: {
                                x: -90,
                                y: 0,
                                z: 0
                        }
                },
                model: {
                        transform: {
                                position: {
                                        x: -0.0482,
                                        y: 0.0132,
                                        z: -0.0463
                                },
                                rotation: {
                                        x: -5.087,
                                        y: 46.187,
                                        z: 0
                                }
                        },
                },
                smoke: {
                        resourceId: "artifact:2040220300586516620",
                        transform: {
                                position: {
                                        x: 0,
                                        y: 0,
                                        z: 0.0375
                                }
                        }
                },
                inhale: {
                        resourceId: "artifact:2040220301114998928",
                        duration: 4,
                },
                exhale: {
                        resourceId: "artifact:2040220301240828049",
                        transform: {
                                position: {
                                        x: 0.00039,
                                        y: -0.091,
                                        z: 0.131
                                }
                        },
                        duration: 4,
                },
                trigger: {
                        transform: {
                                position: {
                                        x: -0.01960001, y: -0.0241, z: 0.1041
                                },
                                rotation: {
                                        x: 0, y: 0, z: 0
                                },
                        },
                        dimensions: {
                                width: 0.04,
                                height: 0.04,
                                depth: 0.04
                        }
                },
                tip: {
                        transform: {
                                position: {
                                        x: -0.01960001, y: 0.0844, z: 0.1041
                                },
                                rotation: {
                                        x: 0, y: 0, z: 0
                                },
                        },
                        dimensions: {
                                width: 0.04,
                                height: 0.04,
                                depth: 0.04
                        }
                },
        }
];

/**
 * The main class of this app. All the logic goes here.
 */
export default class App {
        private cigarApp: CigarsApp;
        private url: string;

        constructor(private context: Context, params: ParameterSet) {
                this.url = params['url'] as string;
                this.context.onStarted(() => this.started());
                this.context.onUserJoined((u: User) => this.userjoined(u));
                this.context.onUserLeft((u: User) => this.userleft(u));
        }

        /**
         * Once the context is "started", initialize the app.
         */
        private async started() {
                const cigars = this.url ? await fetchJSON(this.url) : DEFAULT_CIGARS;
                this.cigarApp = new CigarsApp(this.context, {
                        ashtray: {
                                resourceId: 'artifact:2040220300846563469',
                                dimensions: {
                                        width: 0.13,
                                        height: 0.025,
                                        depth: 0.13
                                }
                        },
                        putout: {
                                resourceId: 'artifact:2040220301500874899',
                                duration: 2,
                        },
                        cigars,
                        mouth: {
                                dimensions: {
                                        width: 0.08,
                                        height: 0.08,
                                        depth: 0.08
                                },
                                transform: {
                                        position: {
                                                x: 0.00039,
                                                y: -0.09840258,
                                                z: 0.1823
                                        }
                                }
                        },
                });
        }

        private async userjoined(user: User) {
                this.cigarApp?.userjoined(user);
        }

        private async userleft(user: User) {
                this.cigarApp?.userleft(user);
        }
}

export interface CigarsAppOptions {
        ashtray: {
                resourceId: string,
                transform?: Partial<ScaledTransformLike>,
                dimensions: {
                        width: number,
                        height: number,
                        depth: number
                }
        },
        model?: {
                resourceId: string,
                transform?: Partial<ScaledTransformLike>,
        },
        putout: {
                resourceId: string,
                transform?: Partial<ScaledTransformLike>,
                duration: number,
        },
        cigars: Partial<CigarOptions>[],
        mouth: {
                attachPoint?: AttachPoint,
                transform: Partial<ScaledTransformLike>,
                dimensions: {
                        width: number,
                        height: number,
                        depth: number
                }
        }
}

export class CigarsApp {
        private assets: AssetContainer;
        private anchor: Actor;

        private players: Map<Guid, Player>;

        private ashtray: Actor;

        // sync fix
        private syncTimeout: NodeJS.Timeout;

        constructor(private context: Context, private options: CigarsAppOptions) {
                this.assets = new AssetContainer(this.context);
                this.players = new Map<Guid, Player>();
                this.assets.createMaterial('invisible', { color: Color4.FromColor3(Color3.Red(), 0.0), alphaMode: AlphaMode.Blend });
                this.init();
        }

        private init() {
                this.anchor = Actor.Create(this.context);
                this.createAshtray();
        }

        private createAshtray() {
                // collider
                const dim = this.options.ashtray.dimensions;
                let mesh = this.assets.meshes.find(m => m.name === 'ashtray_collider');
                if (!mesh) {
                        mesh = this.assets.createBoxMesh('ashtray_collider', dim.width, dim.height, dim.depth);
                }

                const material = this.assets.materials.find(m => m.name === 'invisible');
                const local = translate(this.options.ashtray.transform ? this.options.ashtray.transform : {}).toJSON();
                this.ashtray = Actor.Create(this.context, {
                        actor: {
                                name: 'ashtray',
                                transform: {
                                        local
                                },
                                appearance: {
                                        meshId: mesh.id,
                                        materialId: material.id,
                                },
                                collider: {
                                        geometry: {
                                                shape: ColliderType.Box
                                        },
                                        layer: CollisionLayer.Hologram
                                }
                        }
                });

                // model
                const resourceId = this.options.ashtray.resourceId;
                Actor.CreateFromLibrary(this.context, {
                        resourceId,
                        actor: {
                                parentId: this.ashtray.id,
                        }
                });

                this.setAshtrayBehavior();
        }

        public async userjoined(user: User) {
                if (!this.syncTimeout) {
                        this.syncTimeout = setTimeout(() => {
                                this.sync();
                        }, MIN_SYNC_INTERVAL * 1000);
                }
                this.createPlayer(user);
        }

        public async userleft(user: User) {
                this.removePlayer(user);
        }

        private setAshtrayBehavior() {
                this.ashtray.setBehavior(ButtonBehavior).onClick((user, _) => {
                        const player = this.players.get(user.id);
                        if (!player.equipped) {
                                player?.equipCigar();
                        } else {
                                player.index++;
                        }
                });

        }

        private sync() {
                this.syncTimeout = null;
                this.players.forEach(p => {
                        p.reattach();
                });

                this.setAshtrayBehavior();
        }

        private createPlayer(user: User) {
                if (this.players.has(user.id)) return;
                const player = new Player(this.context, this.assets, {
                        user,
                        mouth: this.options.mouth
                });
                player.onPutout = () => {
                        const local = translate(this.options.putout.transform ? this.options.putout.transform : {}).toJSON();
                        const actor = Actor.CreateFromLibrary(this.context, {
                                resourceId: this.options.putout.resourceId,
                                actor: {
                                        parentId: this.anchor.id,
                                        transform: {
                                                local
                                        },
                                }
                        });
                        setTimeout(() => {
                                actor.destroy();
                        }, this.options.putout.duration * 1000);
                }
                player.getCigarOptions = () => {
                        return this.options.cigars;
                }
                player.index = 0;

                this.players.set(user.id, player);
        }

        private removePlayer(user: User) {
                if (!this.players.get(user.id)) return;
                this.players.get(user.id)?.remove();
                this.players.delete(user.id);
        }
}