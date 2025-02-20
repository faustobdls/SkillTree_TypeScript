import { SkillNode } from "../SkillNode";

interface ISkillTreeRenderer {
    Initialized: boolean;
    Initialize(): Promise<boolean>;

    
    // customize
    PositionedOn(): void;
    CustomStartRenderHover(skillNode: SkillNode): void;
    CustomStopRenderHover(skillNode: SkillNode): void;

    RenderActive(): void;
    RenderBase(): void;
    RenderCharacterStartsActive(): void;
    RenderHighlight(): void;
    StartRenderHover(skillNode: SkillNode): void;
    StopRenderHover(skillNode: SkillNode): void;
    CreateScreenshot(mimeType: "image/jpeg" | "image/webp"): Promise<string>;
}