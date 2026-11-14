export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    try {
      // LOGIN
      if (path === "/api/login" && method === "POST") {
        const { username, password } = await request.json();
        const user = await env.DB.prepare(
          "SELECT id, username, nama, email, role FROM users WHERE username = ? AND password = ?"
        ).bind(username, password).first();

        if (!user) {
          return Response.json({ success: false, message: "Username atau password salah" }, { status: 401, headers: cors });
        }
        return Response.json({ success: true, user }, { headers: cors });
      }

      // GET ALL USERS
      if (path === "/api/users" && method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT id, username, nama, email, role FROM users ORDER BY id"
        ).all();
        return Response.json({ success: true, data: results }, { headers: cors });
      }

      // CREATE
      if (path === "/api/users" && method === "POST") {
        const { username, password, nama, email, role } = await request.json();
        if (!username || !password || !nama || !email) {
          return Response.json({ success: false, message: "Semua field wajib diisi" }, { status: 400, headers: cors });
        }
        try {
          const result = await env.DB.prepare(
            "INSERT INTO users (username, password, nama, email, role) VALUES (?, ?, ?, ?, ?)"
          ).bind(username, password, nama, email, role || "User").run();
          return Response.json({ success: true, message: "Data berhasil ditambahkan" }, { headers: cors });
        } catch (e) {
          return Response.json({ success: false, message: "Username sudah digunakan" }, { status: 409, headers: cors });
        }
      }

      // UPDATE
      if (path.startsWith("/api/users/") && method === "PUT") {
        const id = path.split("/").pop();
        const { username, password, nama, email, role } = await request.json();

        if (password) {
          await env.DB.prepare(
            "UPDATE users SET username=?, password=?, nama=?, email=?, role=? WHERE id=?"
          ).bind(username, password, nama, email, role, id).run();
        } else {
          await env.DB.prepare(
            "UPDATE users SET username=?, nama=?, email=?, role=? WHERE id=?"
          ).bind(username, nama, email, role, id).run();
        }
        return Response.json({ success: true, message: "Data berhasil diupdate" }, { headers: cors });
      }

      // DELETE
      if (path.startsWith("/api/users/") && method === "DELETE") {
        const id = path.split("/").pop();
        await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
        return Response.json({ success: true, message: "Data berhasil dihapus" }, { headers: cors });
      }

      return Response.json({ success: false, message: "Not found" }, { status: 404, headers: cors });
    } catch (err) {
      return Response.json({ success: false, message: err.message }, { status: 500, headers: cors });
    }
  },
};
