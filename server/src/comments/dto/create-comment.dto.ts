export class CreateCommentDto {
  content: string;
  author: string;
  article_id: number;
  parent_id?: number;
}
