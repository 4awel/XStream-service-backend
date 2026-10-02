import { TagGroup, TagKind } from "@prisma/generated";

export type TagProps = {
  id: string;
  slug: string;
  title: string;
  kind: TagKind;

  group: TagGroup | null;
  isMature: boolean;
  isVisible: boolean;
  externalId: string | null;

  viewersCount: number;
};

export class Tag {
  constructor(private readonly props: TagProps) {}

  public get id(): string {
    return this.props.id;
  }

  public get slug(): string {
    return this.props.slug;
  }

  public get title(): string {
    return this.props.title;
  }

  public get kind(): TagKind {
    return this.props.kind;
  }

  public get group(): TagGroup | null {
    return this.props.group;
  }

  public get isMature(): boolean {
    return this.props.isMature;
  }

  public get isVisible(): boolean {
    return this.props.isVisible;
  }

  public get externalId(): string | null {
    return this.props.externalId;
  }

  public get viewersCount(): number {
    return this.props.viewersCount;
  }

  // Может ли быть основной категорией канала
  public canBePrimary(): boolean {
    return this.props.kind === TagKind.CATEGORY && this.props.isVisible;
  }

  // Показывать ли плитку в каталоге зрителю
  public isVisibleFor(showMature: boolean): boolean {
    return this.props.isVisible && (!this.props.isMature || showMature);
  }
}
