## Import b-roll library from folders

This repo is the Cutflow **frontend**. Your b-roll assets live on disk (example: `D:\xampp\htdocs\CutFlow - Videos`) and must be imported into your **cutflow-api** so the editor can load them through:

- `GET /brolls/library`

### Folder structure

The importer expects:

- Each top-level folder under `--root` is a **category**
- Each subfolder under a category is a **subcategory**
- Media files placed directly inside a category folder are imported into a synthetic subcategory (default: `General`)

Example:

- `CutFlow - Videos/Food/(files...)` → Category: `Food`, Subcategory: `General`
- `CutFlow - Videos/Food/Burgers/(files...)` → Category: `Food`, Subcategory: `Burgers`

### Run (dry-run first)

PowerShell:

```bash
cd D:\xampp\htdocs\cutflow
npm run import:brolls -- --root "D:\xampp\htdocs\CutFlow - Videos" --api-base "http://127.0.0.1:8000/api" --dry-run
```

Then run live:

```bash
npm run import:brolls -- --root "D:\xampp\htdocs\CutFlow - Videos" --api-base "http://127.0.0.1:8000/api"
```

### Options

- `--token <token>`: if your API is protected, sends `Authorization: Bearer <token>`
- `--concurrency <n>`: parallel uploads (default: 3)
- `--general-subcategory <name>`: name used for category-root files (default: `General`)
- `--premium`: marks imported items as premium
- `--include-ext ".mp4,.jpg"`: only import these extensions
- `--verbose`: logs per-category scan and more progress output

### Required API endpoints (assumed by the script)

The importer calls these endpoints (relative to `--api-base`):

- `GET /brolls/library`
- `POST /categories` JSON: `{ "name": string }`
- `POST /categories` JSON: `{ "parent_id": number, "name": string }` (subcategory)
- `POST /media` multipart form-data fields:
  - `category_id` (number) *(leaf category / subcategory id)*
  - `subcategory_id` (number) *(leaf category / subcategory id)*
  - `parent_id` (number) *(optional: parent category id)*
  - `parent_category_id` (number) *(optional: parent category id)*
  - `name` (string)
  - `type` ("image" | "video")
  - `is_premium` ("0" | "1")
  - `file` (uploaded file)

If your `cutflow-api` uses different routes/field names, tell me what they are (or paste the Laravel routes/controller signatures) and I’ll adjust the script to match exactly.

Route::get('/brolls/library', [BrollController::class, 'library']);
Route::post('/media', [BrollController::class, 'store']);

//create and fetch categories
Route::post('/categories', [CategoryController::class, 'store']);  //for sub category add "parent_id" key 
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

