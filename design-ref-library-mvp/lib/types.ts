export type Folder = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
};

export type ImageRow = {
  id: string;
  user_id: string;
  folder_id: string | null;
  storage_path: string;
  thumb_path: string;
  original_filename: string | null;
  width: number | null;
  height: number | null;
  source_url: string | null;
  memo: string;
  created_at: string;
  updated_at: string;
};

export type ImageWithRelations = ImageRow & {
  folder: Folder | null;
  tags: Tag[];
};
