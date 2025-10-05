export default function Upload() {
  return (
    <div>
      <h2>Upload</h2>
      <form>
        <label>
          Select Image:
          <input type="file" accept="image/*" />
        </label>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}
