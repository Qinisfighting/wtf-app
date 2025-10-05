export default function Login() {
  return (
    <div className="px-12 mx-auto w-full lg:w-1/2">
      <h2 className="text-xl font-bold mb-6 whitespace-normal text-center m-auto">
        Are you one of the crazy{" "}
        <span className="text-[#F74211] text-3xl">Q</span>s? prove it...
      </h2>

      <form className="sm:w-1/2 grid grid-cols-1 sm:grid-cols-[auto,1fr,auto] items-center gap-4 w-full m-auto">
        <input
          id="password"
          type="password"
          name="password"
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Enter password"
        />

        <button
          type="submit"
          className="bg-[#F74211] text-white rounded px-4 h-[42px] hover:bg-[#d63c0e] transition-colors font-medium "
        >
          Go!
        </button>
      </form>
    </div>
  );
}
