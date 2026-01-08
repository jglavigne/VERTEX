import pool from "./db";

export async function getCustomData(
  classe: string,
  workspace: string,
  grp: string,
  item: string
) {
  return getCustomDataObj({ classe, workspace, grp, item });
}

export async function getCustomDataObj({ classe, workspace, grp, item }) {
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT data FROM CUSTOMDT 
       WHERE classe=$1 AND workspace=$2 AND grp=$3 AND item=$4`,
      [classe, workspace, grp, item]
    );
    client.release();
    const data = result.rows[0]?.data || null;
    // Décodage automatique
    if (data && typeof data === "object" && "key" in data && "value" in data) {
      return data.value; // retourne la primitive
    }
    return data; // objet ou tableau complexe
  } catch (err) {
    console.error("Erreur SELECT CUSTOMDT:", err);
    throw err;
  }
}

export async function upsertCustomData(
  classe: string,
  workspace: string,
  grp: string,
  item: string,
  data: any
) {
  return upsertCustomDataObj({ classe, workspace, grp, item, data });
}

export async function upsertCustomDataObj({
  classe,
  workspace,
  grp,
  item,
  data,
}) {
  try {
    const client = await pool.connect();
    // Détection automatique : si primitive, on enveloppe dans { key, value }
    const jsonData =
      typeof data === "object" && data !== null
        ? data
        : { key: item, value: data };

    const result = await client.query(
      `INSERT INTO CUSTOMDT (classe, workspace, grp, item, data)
        VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (classe, workspace, grp, item)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
       RETURNING *`,
      [classe, workspace, grp, item, JSON.stringify(jsonData)]
    );
    client.release();
    return result.rows[0];
  } catch (err) {
    console.error("Erreur UPSERT CUSTOMDT:", err);
    throw err;
  }
}

export async function deleteCustomData({ classe, workspace, grp, item }) {
  try {
    const client = await pool.connect();
    await client.query(
      `DELETE FROM CUSTOMDT 
       WHERE classe=$1 AND workspace=$2 AND grp=$3 AND item=$4`,
      [classe, workspace, grp, item]
    );
    client.release();
    return true;
  } catch (err) {
    console.error("Erreur DELETE CUSTOMDT:", err);
    throw err;
  }
}

export async function listByWorkspace(workspace) {
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM CUSTOMDT WHERE workspace = $1`,
      [workspace]
    );
    client.release();
    return result.rows;
  } catch (err) {
    console.error("Erreur SELECT workspace CUSTOMDT:", err);
    throw err;
  }
}
