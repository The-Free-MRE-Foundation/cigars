/*!
 * Copyright (c) The Free MRE Foundation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, AssetContainer, AttachPoint, ColliderType, CollisionLayer, Context, ScaledTransformLike, User } from "@microsoft/mixed-reality-extension-sdk";
import { Cigar, CigarOptions } from "./cigar";
import { translate } from "./utils";

export interface PlayerOptions {
        user: User,
        mouth: {
                attachPoint?: AttachPoint,
                transform: Partial<ScaledTransformLike>,
                dimensions: {
                        width: number,
                        height: number,
                        depth: number
                }
        },
}

export class Player {
        private mouth: Actor;
        private cigar: Cigar;
        private model: Actor;

        private _index: number = 0;
        get index() {
                return this._index;
        }
        set index(i: number) {
                const cigars = this.getCigarOptions();
                this._index = Math.max(0, i) % cigars.length;
                const cigar = cigars[this.index];
                this.updateModel(cigar as CigarOptions);
        }

        get equipped() {
                return this.cigar != undefined;
        }

        public onPutout: () => void;
        public getCigarOptions: () => Partial<CigarOptions>[];

        constructor(private context: Context, private assets: AssetContainer, private options: PlayerOptions) {
                this.init();
        }

        private init() {
                this.createMouth();
        }

        private createMouth() {
                if (this.mouth) { return; }
                const local = translate(this.options.mouth.transform).toJSON();
                const dim = this.options.mouth.dimensions;
                const name = `${dim.width},${dim.height},${dim.depth}`;
                let mesh = this.assets.meshes.find(m => m.name === name);
                if (!mesh) {
                        mesh = this.assets.createBoxMesh(name, dim.width, dim.height, dim.depth);
                }

                const material = this.assets.materials.find(m => m.name === 'invisible');

                this.mouth = Actor.Create(this.context, {
                        actor: {
                                name: 'mouth',
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
                                },
                                attachment: {
                                        userId: this.options.user.id,
                                        attachPoint: this.options.mouth.attachPoint ? this.options.mouth.attachPoint : 'head'
                                }
                        }
                });
        }

        private updateModel(options: CigarOptions) {
                if (this.model && this.model.name == options.name) return;
                this.model?.destroy();
                const local = translate(options.model.transform).toJSON();
                this.model = Actor.CreateFromLibrary(this.context, {
                        resourceId: options.resourceId,
                        actor: {
                                name: options.name,
                                transform: {
                                        local
                                }
                        }
                });
        }

        public equipCigar() {
                if (this.cigar) return;
                const options = Object.assign({ user: this.options.user }, this.getCigarOptions()[this.index]) as CigarOptions;
                this.cigar = new Cigar(this.context, this.assets, options);
                this.cigar.onPutout = () => {
                        this.removeCigar();
                }
        }

        public removeCigar() {
                this.cigar?.remove();
                this.cigar = undefined;
                this.onPutout();
        }

        public remove() {
                this.mouth.destroy();
                this.cigar?.remove();
                this.model?.destroy();
        }

        public reattach() {
                if (this.mouth) {
                        const attachPoint = this.options.mouth.attachPoint ? this.options.mouth.attachPoint : 'head';
                        const userId = this.options.user;
                        this.mouth.detach();
                        this.mouth.attach(userId, attachPoint);
                }

                if (this.cigar) {
                        this.cigar.reattach();
                }
        }
}
