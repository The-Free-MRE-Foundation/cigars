/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, AssetContainer, AttachPoint, ColliderType, CollisionLayer, Color3, Color4, Context, ScaledTransformLike, User } from "@microsoft/mixed-reality-extension-sdk";
import { translate } from "./utils";

export interface CigarOptions {
        name: string,
        user: User,
        attachPoint?: AttachPoint,
        resourceId: string,
        transform: Partial<ScaledTransformLike>,
        model?: {
                transform: Partial<ScaledTransformLike>,
        },
        smoke: {
                resourceId: string,
                transform: Partial<ScaledTransformLike>,
        },
        exhale: {
                resourceId: string,
                transform: Partial<ScaledTransformLike>,
                duration?: number,
        },
        inhale: {
                resourceId: string,
                transform?: Partial<ScaledTransformLike>,
                duration?: number,
        },
        trigger: {
                transform: Partial<ScaledTransformLike>,
                dimensions: {
                        width: number,
                        height: number,
                        depth: number
                }
        },
        tip: {
                transform: Partial<ScaledTransformLike>,
                dimensions: {
                        width: number,
                        height: number,
                        depth: number
                }
        }
}

const MIN_SMOKE_INTERVAL = 1000;

export class Cigar {
        private anchor: Actor;
        private model: Actor;
        private trigger: Actor;
        private tip: Actor;

        private lastInhale: number = 0;
        private inhaling: boolean = false;

        public onPutout: () => void;

        get name(){
                return this.options.name;
        }

        constructor(private context: Context, private assets: AssetContainer, private options: CigarOptions) {
                this.init();
        }

        private init() {
                this.anchor = Actor.Create(this.context, {
                        actor: {
                                attachment: {
                                        userId: this.options.user.id,
                                        attachPoint: this.options.attachPoint ? this.options.attachPoint : 'right-hand',
                                }
                        }
                });
                this.createModel();
                this.createTrigger();
                this.createTip();
        }

        private createModel() {
                let local = translate(this.options.transform).toJSON();
                this.model = Actor.CreateFromLibrary(this.context, {
                        resourceId: this.options.resourceId,
                        actor: {
                                parentId: this.anchor.id,
                                transform: {
                                        local
                                },
                                attachment: {
                                        userId: this.options.user.id,
                                        attachPoint: this.options.attachPoint ? this.options.attachPoint : 'right-hand'
                                }
                        }
                });

                local = translate(this.options.smoke.transform).toJSON();
                Actor.CreateFromLibrary(this.context, {
                        resourceId: this.options.smoke.resourceId,
                        actor: {
                                parentId: this.model.id,
                                transform: {
                                        local
                                }
                        }
                });
        }

        private createTrigger() {
                const local = translate(this.options.trigger.transform).toJSON();
                const dim = this.options.trigger.dimensions;
                const name = `${dim.width},${dim.height},${dim.depth}`;
                let mesh = this.assets.meshes.find(m => m.name === name);
                if (!mesh) {
                        mesh = this.assets.createBoxMesh(name, dim.width, dim.height, dim.depth);
                }

                const material = this.assets.materials.find(m => m.name === 'invisible');

                this.trigger = Actor.Create(this.context, {
                        actor: {
                                owner: this.options.user.id,
                                parentId: this.anchor.id,
                                transform: {
                                        local,
                                },
                                appearance: {
                                        meshId: mesh.id,
                                        materialId: material.id,
                                },
                                collider: {
                                        geometry: { shape: ColliderType.Box },
                                        layer: CollisionLayer.Hologram,
                                        isTrigger: true,
                                },
                                rigidBody: {
                                        enabled: true,
                                        isKinematic: true,
                                        useGravity: false
                                },
                        }
                });

                this.trigger.collider.onTrigger('trigger-enter', (actor: Actor) => {
                        if (actor.name == 'mouth') {
                                this.inhale();
                        }
                });

                this.trigger.collider.onTrigger('trigger-exit', (actor: Actor) => {
                        if (actor.name == 'mouth') {
                                this.exhale();
                        }
                });
        }

        private createTip() {
                const local = translate(this.options.tip.transform).toJSON();
                const dim = this.options.tip.dimensions;
                const name = `${dim.width},${dim.height},${dim.depth}`;
                let mesh = this.assets.meshes.find(m => m.name === name);
                if (!mesh) {
                        mesh = this.assets.createBoxMesh(name, dim.width, dim.height, dim.depth);
                }

                const material = this.assets.materials.find(m => m.name === 'invisible');

                this.tip = Actor.Create(this.context, {
                        actor: {
                                owner: this.options.user.id,
                                parentId: this.anchor.id,
                                transform: {
                                        local,
                                },
                                appearance: {
                                        meshId: mesh.id,
                                        materialId: material.id,
                                },
                                collider: {
                                        geometry: { shape: ColliderType.Box },
                                        layer: CollisionLayer.Hologram,
                                        isTrigger: true,
                                },
                                rigidBody: {
                                        enabled: true,
                                        isKinematic: true,
                                        useGravity: false
                                },
                        }
                });

                this.tip.collider.onTrigger('trigger-enter', (actor: Actor) => {
                        if (actor.name == 'ashtray') {
                                this.onPutout();
                        }
                });
        }

        private inhale() {
                const now = Date.now();
                if (now - this.lastInhale <= MIN_SMOKE_INTERVAL) { return; }
                this.lastInhale = now;
                const options = this.options.inhale;
                const local = translate(options.transform ? options.transform : {}).toJSON();
                const actor = Actor.CreateFromLibrary(this.context, {
                        resourceId: options.resourceId,
                        actor: {
                                parentId: this.anchor.id,
                                transform: {
                                        local
                                },
                        }
                });
                this.inhaling = true;

                setTimeout(() => {
                        actor.destroy();
                }, options.duration * 1000);
        }

        private exhale() {
                if (!this.inhaling) return;

                const options = this.options.exhale;
                const local = translate(options.transform).toJSON();
                const actor = Actor.CreateFromLibrary(this.context, {
                        resourceId: options.resourceId,
                        actor: {
                                transform: {
                                        local
                                },
                                attachment: {
                                        userId: this.options.user.id,
                                        attachPoint: 'head',
                                }
                        }
                });

                this.inhaling = false;

                setTimeout(() => {
                        actor.destroy();
                }, options.duration * 1000);
        }

        public remove() {
                this.model.destroy();
                this.trigger.destroy();
                this.anchor.destroy();
        }

        public reattach() {
                const attachPoint = this.options.attachPoint ? this.options.attachPoint : 'right-hand';
                const userId = this.options.user;
                this.anchor.detach();
                this.anchor.attach(userId, attachPoint);
        }
}
