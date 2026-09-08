import test from "node:test";
import assert from "node:assert/strict";
import { hasMitreTactic, MITRE_DB } from "../src/lib/mitre-db.ts";

test("MITRE catalog keeps unique IDs and complete metadata", () => {
  const ids = MITRE_DB.map(technique => technique.id.toUpperCase());
  assert.equal(new Set(ids).size, ids.length);

  for (const technique of MITRE_DB) {
    assert.match(technique.id, /^T\d{4}(\.\d{3})?$/);
    assert.ok(technique.name.trim(), technique.id);
    assert.ok(technique.description.trim(), technique.id);
    assert.ok(technique.example.trim(), technique.id);
    assert.ok(technique.platform, technique.id);
  }
});

test("new supply-chain, discovery, evasion and firewall techniques are simulator-ready", () => {
  const expected = [
    "T1059.013",
    "T1213.006",
    "T1546.018",
    "T1677",
    "T1680",
    "T1518.002",
    "T1679",
    "T1681",
    "T1036.012",
    "T1686.002",
    "T1686.003",
    "T1204.005",
  ];

  for (const id of expected) assert.ok(MITRE_DB.some(technique => technique.id === id), id);
});

test("Reconnaissance is complete for the Enterprise v19.2 catalog", () => {
  const reconnaissanceIds = new Set(MITRE_DB.filter(technique => technique.tactic === "Reconnaissance").map(technique => technique.id));
  const expectedParents = ["T1595", "T1592", "T1589", "T1590", "T1591", "T1598", "T1682", "T1597", "T1596", "T1593", "T1681", "T1594"];
  const expectedSubtechniques = [
    "T1595.001", "T1595.002", "T1595.003",
    "T1592.001", "T1592.002", "T1592.003", "T1592.004",
    "T1589.001", "T1589.002", "T1589.003",
    "T1590.001", "T1590.002", "T1590.003", "T1590.004", "T1590.005", "T1590.006",
    "T1591.001", "T1591.002", "T1591.003", "T1591.004",
    "T1598.001", "T1598.002", "T1598.003", "T1598.004",
    "T1597.001", "T1597.002",
    "T1596.001", "T1596.002", "T1596.003", "T1596.004", "T1596.005",
    "T1593.001", "T1593.002", "T1593.003",
  ];

  for (const id of [...expectedParents, ...expectedSubtechniques]) assert.ok(reconnaissanceIds.has(id), id);
  assert.equal(reconnaissanceIds.size, expectedParents.length + expectedSubtechniques.length);
  for (const technique of MITRE_DB.filter(item => item.tactic === "Reconnaissance")) assert.equal(technique.platform, "PRE", technique.id);
});

test("Resource Development is complete for the Enterprise v19.2 catalog", () => {
  const resourceIds = new Set(MITRE_DB.filter(technique => technique.tactic === "Resource Development").map(technique => technique.id));
  const expected = [
    "T1650",
    "T1583", "T1583.001", "T1583.002", "T1583.003", "T1583.004", "T1583.005", "T1583.006", "T1583.007", "T1583.008",
    "T1586", "T1586.001", "T1586.002", "T1586.003",
    "T1584", "T1584.001", "T1584.002", "T1584.003", "T1584.004", "T1584.005", "T1584.006", "T1584.007", "T1584.008",
    "T1587", "T1587.001", "T1587.002", "T1587.003", "T1587.004",
    "T1585", "T1585.001", "T1585.002", "T1585.003",
    "T1683", "T1683.001", "T1683.002",
    "T1588", "T1588.001", "T1588.002", "T1588.003", "T1588.004", "T1588.005", "T1588.006", "T1588.007",
    "T1608", "T1608.001", "T1608.002", "T1608.003", "T1608.004", "T1608.005", "T1608.006",
  ];

  assert.equal(resourceIds.size, expected.length);
  for (const id of expected) assert.ok(resourceIds.has(id), id);
  for (const technique of MITRE_DB.filter(item => item.tactic === "Resource Development")) assert.equal(technique.platform, "PRE", technique.id);
});

test("Initial Access is complete for the Enterprise v19.2 catalog", () => {
  const initialAccessIds = new Set(MITRE_DB.filter(technique => technique.tactic === "Initial Access").map(technique => technique.id));
  const expected = [
    "T1659", "T1189", "T1190", "T1133", "T1200", "T1566", "T1091", "T1195", "T1199", "T1078", "T1669",
    "T1566.001", "T1566.002", "T1566.003", "T1566.004",
    "T1195.001", "T1195.002", "T1195.003",
    "T1078.001", "T1078.002", "T1078.003", "T1078.004",
  ];

  assert.equal(initialAccessIds.size, expected.length);
  for (const id of expected) assert.ok(initialAccessIds.has(id), id);
});

test("Execution is complete for the Enterprise v19.2 catalog", () => {
  const execution = MITRE_DB.filter(technique => hasMitreTactic(technique, "Execution"));
  const executionIds = new Set(execution.map(technique => technique.id));
  const expectedParents = [
    "T1197", "T1651", "T1059", "T1609", "T1610", "T1675", "T1203", "T1574", "T1674", "T1559",
    "T1106", "T1677", "T1053", "T1648", "T1129", "T1072", "T1569", "T1127", "T1204", "T1047",
  ];
  const expectedSubtechniques = [
    "T1059.001", "T1059.002", "T1059.003", "T1059.004", "T1059.005", "T1059.006", "T1059.007", "T1059.008", "T1059.009", "T1059.010", "T1059.011", "T1059.012", "T1059.013",
    "T1574.001", "T1574.004", "T1574.005", "T1574.006", "T1574.007", "T1574.008", "T1574.009", "T1574.010", "T1574.011", "T1574.012", "T1574.013", "T1574.014",
    "T1559.001", "T1559.002", "T1559.003",
    "T1053.002", "T1053.003", "T1053.005", "T1053.006", "T1053.007",
    "T1569.001", "T1569.002", "T1569.003",
    "T1127.001", "T1127.002", "T1127.003",
    "T1204.001", "T1204.002", "T1204.003", "T1204.004", "T1204.005",
  ];

  for (const id of [...expectedParents, ...expectedSubtechniques]) assert.ok(executionIds.has(id), id);
  assert.equal(new Set([...expectedParents, ...expectedSubtechniques]).size, executionIds.size);
  for (const id of expectedSubtechniques) {
    const definition = execution.find(technique => technique.id === id);
    assert.equal(definition?.parentId ?? id.split(".")[0], id.split(".")[0], id);
  }
});

test("Persistence covers the Enterprise v19.2 catalog and preserves cross-tactic entries", () => {
  const persistence = MITRE_DB.filter(technique => hasMitreTactic(technique, "Persistence"));
  const ids = new Set(persistence.map(technique => technique.id));
  const parents = [
    "T1098", "T1197", "T1547", "T1037", "T1671", "T1554", "T1136", "T1543", "T1546", "T1668", "T1133",
    "T1525", "T1556", "T1112", "T1137", "T1653", "T1542", "T1053", "T1505", "T1176", "T1205", "T1078",
  ];

  assert.equal(persistence.length, 113);
  assert.equal(new Set(persistence.map(technique => technique.id)).size, persistence.length);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of persistence.filter(item => item.id.includes("."))) {
    const parent = technique.parentId ?? technique.id.split(".")[0];
    assert.ok(ids.has(parent), `${technique.id} -> ${parent}`);
  }
  for (const id of ["T1197", "T1133", "T1112", "T1078", "T1053.005", "T1053.003"]) {
    assert.ok(MITRE_DB.find(technique => technique.id === id)?.tactics?.includes("Persistence"), id);
  }
});

test("Privilege Escalation covers the Enterprise v19.2 catalog", () => {
  const privilegeEscalation = MITRE_DB.filter(technique => hasMitreTactic(technique, "Privilege Escalation"));
  const ids = new Set(privilegeEscalation.map(technique => technique.id));
  const parents = ["T1548", "T1134", "T1098", "T1547", "T1037", "T1484", "T1611", "T1546", "T1068", "T1055", "T1053", "T1078", "T1543"];
  const expectedNewSubtechniques = [
    "T1548.001", "T1548.002", "T1548.003", "T1548.004", "T1548.005", "T1548.006",
    "T1134.001", "T1134.002", "T1134.003", "T1134.004", "T1134.005",
    "T1484.001", "T1484.002",
    "T1055.001", "T1055.002", "T1055.003", "T1055.004", "T1055.005", "T1055.008", "T1055.009", "T1055.011", "T1055.012", "T1055.013", "T1055.014", "T1055.015",
  ];

  assert.equal(privilegeEscalation.length, 96);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const id of expectedNewSubtechniques) assert.ok(ids.has(id), id);
});

test("Stealth covers the Enterprise v19.2 catalog", () => {
  const stealth = MITRE_DB.filter(technique => hasMitreTactic(technique, "Stealth"));
  const ids = new Set(stealth.map(technique => technique.id));
  const parents = [
    "T1134", "T1197", "T1612", "T1622", "T1678", "T1140", "T1006", "T1480", "T1211", "T1564",
    "T1574", "T1070", "T1202", "T1036", "T1027", "T1542", "T1055", "T1620", "T1014", "T1679",
    "T1684", "T1218", "T1216", "T1221", "T1205", "T1127", "T1535", "T1078", "T1497", "T1220",
  ];

  assert.equal(stealth.length, 150);
  assert.equal(stealth.filter(technique => !technique.parentId).length, parents.length);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of stealth.filter(item => item.id.includes("."))) {
    const parent = technique.parentId ?? technique.id.split(".")[0];
    assert.ok(ids.has(parent), `${technique.id} -> ${parent}`);
  }
  for (const id of ["T1027.013", "T1564.014", "T1070.010", "T1218.015", "T1497.003"]) {
    assert.ok(ids.has(id), id);
  }
});

test("Defense Impairment covers the current Enterprise catalog", () => {
  const impairment = MITRE_DB.filter(technique => hasMitreTactic(technique, "Defense Impairment"));
  const ids = new Set(impairment.map(technique => technique.id));
  const parents = [
    "T1686", "T1685", "T1484", "T1689", "T1687", "T1222", "T1556", "T1578", "T1666",
    "T1112", "T1601", "T1599", "T1647", "T1690", "T1207", "T1688", "T1553", "T1600",
  ];

  assert.equal(impairment.length, 57);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of impairment.filter(item => item.parentId)) {
    assert.ok(ids.has(technique.parentId!), `${technique.id} -> ${technique.parentId}`);
  }
  for (const id of ["T1686.001", "T1685.006", "T1578.005", "T1553.006", "T1600.002"]) {
    assert.ok(ids.has(id), id);
  }
  assert.ok(MITRE_DB.find(technique => technique.id === "T1562.001")?.tactics?.includes("Defense Impairment"));
});

test("Credential Access covers the Enterprise catalog", () => {
  const credentialAccess = MITRE_DB.filter(technique => hasMitreTactic(technique, "Credential Access"));
  const ids = new Set(credentialAccess.map(technique => technique.id));
  const parents = [
    "T1557", "T1110", "T1555", "T1212", "T1187", "T1606", "T1056", "T1556", "T1111",
    "T1621", "T1040", "T1003", "T1528", "T1649", "T1558", "T1539", "T1552",
  ];

  assert.equal(credentialAccess.length, 67);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of credentialAccess.filter(item => item.parentId)) {
    assert.ok(ids.has(technique.parentId!), `${technique.id} -> ${technique.parentId}`);
  }
  for (const id of ["T1557.004", "T1555.006", "T1003.007", "T1558.005", "T1552.008"]) {
    assert.ok(ids.has(id), id);
  }
  for (const id of ["T1556", "T1556.003", "T1556.009"]) {
    assert.ok(MITRE_DB.find(technique => technique.id === id)?.tactics?.includes("Credential Access"), id);
  }
});

test("Discovery covers the Enterprise catalog", () => {
  const discovery = MITRE_DB.filter(technique => hasMitreTactic(technique, "Discovery"));
  const ids = new Set(discovery.map(technique => technique.id));
  const parents = [
    "T1087", "T1010", "T1217", "T1580", "T1538", "T1526", "T1619", "T1613", "T1622", "T1652",
    "T1482", "T1083", "T1615", "T1680", "T1654", "T1046", "T1135", "T1040", "T1201", "T1120",
    "T1069", "T1057", "T1012", "T1018", "T1518", "T1082", "T1614", "T1016", "T1049", "T1033",
    "T1007", "T1124", "T1673", "T1497",
  ];

  assert.equal(discovery.length, 49);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of discovery.filter(item => item.parentId)) {
    assert.ok(ids.has(technique.parentId!), `${technique.id} -> ${technique.parentId}`);
  }
  for (const id of ["T1087.004", "T1069.003", "T1016.002", "T1518.001", "T1497.003"]) {
    assert.ok(ids.has(id), id);
  }
});

test("Lateral Movement covers the Enterprise catalog", () => {
  const lateralMovement = MITRE_DB.filter(technique => hasMitreTactic(technique, "Lateral Movement"));
  const ids = new Set(lateralMovement.map(technique => technique.id));
  const parents = ["T1210", "T1534", "T1570", "T1563", "T1021", "T1091", "T1072", "T1080", "T1550"];

  assert.equal(lateralMovement.length, 23);
  assert.equal(lateralMovement.filter(technique => !technique.parentId).length, parents.length);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of lateralMovement.filter(item => item.parentId)) {
    assert.ok(ids.has(technique.parentId!), `${technique.id} -> ${technique.parentId}`);
  }
  for (const id of ["T1021.003", "T1021.006", "T1021.008", "T1550.003", "T1563.002"]) {
    assert.ok(ids.has(id), id);
  }
});

test("Collection covers the Enterprise catalog", () => {
  const collection = MITRE_DB.filter(technique => hasMitreTactic(technique, "Collection"));
  const ids = new Set(collection.map(technique => technique.id));
  const parents = [
    "T1557", "T1560", "T1123", "T1119", "T1185", "T1115", "T1530", "T1602", "T1213",
    "T1005", "T1039", "T1025", "T1074", "T1114", "T1056", "T1113", "T1125",
  ];

  assert.equal(collection.length, 41);
  assert.equal(collection.filter(technique => !technique.parentId).length, parents.length);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of collection.filter(item => item.parentId)) {
    assert.ok(ids.has(technique.parentId!), `${technique.id} -> ${technique.parentId}`);
  }
  for (const id of ["T1557.004", "T1560.003", "T1602.002", "T1213.006", "T1074.002", "T1114.003", "T1056.004"]) {
    assert.ok(ids.has(id), id);
  }
  for (const id of ["T1557", "T1056", "T1560", "T1213"]) {
    assert.ok(MITRE_DB.find(technique => technique.id === id)?.tactics?.includes("Collection"), id);
  }
});

test("Command and Control covers the Enterprise catalog", () => {
  const commandAndControl = MITRE_DB.filter(technique => hasMitreTactic(technique, "Command and Control"));
  const ids = new Set(commandAndControl.map(technique => technique.id));
  const parents = [
    "T1071", "T1092", "T1659", "T1132", "T1001", "T1568", "T1573", "T1008", "T1665",
    "T1105", "T1104", "T1095", "T1571", "T1572", "T1090", "T1219", "T1205", "T1102",
  ];

  assert.equal(commandAndControl.length, 45);
  assert.equal(commandAndControl.filter(technique => !technique.parentId).length, parents.length);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of commandAndControl.filter(item => item.parentId)) {
    assert.ok(ids.has(technique.parentId!), `${technique.id} -> ${technique.parentId}`);
  }
  for (const id of ["T1071.005", "T1001.003", "T1568.003", "T1090.004", "T1219.003", "T1102.003"]) {
    assert.ok(ids.has(id), id);
  }
  for (const id of ["T1071", "T1105", "T1205", "T1568"]) {
    assert.ok(MITRE_DB.find(technique => technique.id === id)?.tactics?.includes("Command and Control"), id);
  }
});

test("Exfiltration covers the Enterprise catalog", () => {
  const exfiltration = MITRE_DB.filter(technique => hasMitreTactic(technique, "Exfiltration"));
  const ids = new Set(exfiltration.map(technique => technique.id));
  const parents = ["T1020", "T1030", "T1048", "T1041", "T1011", "T1052", "T1567", "T1029", "T1537"];

  assert.equal(exfiltration.length, 19);
  assert.equal(exfiltration.filter(technique => !technique.parentId).length, parents.length);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of exfiltration.filter(item => item.parentId)) {
    assert.ok(ids.has(technique.parentId!), `${technique.id} -> ${technique.parentId}`);
  }
  for (const id of ["T1020.001", "T1048.003", "T1011.001", "T1052.001", "T1567.004"]) {
    assert.ok(ids.has(id), id);
  }
  for (const id of ["T1048", "T1567"]) {
    assert.ok(MITRE_DB.find(technique => technique.id === id)?.tactics?.includes("Exfiltration"), id);
  }
});

test("Impact covers the Enterprise catalog", () => {
  const impact = MITRE_DB.filter(technique => hasMitreTactic(technique, "Impact"));
  const ids = new Set(impact.map(technique => technique.id));
  const parents = [
    "T1531", "T1485", "T1486", "T1565", "T1491", "T1561", "T1667", "T1499",
    "T1657", "T1495", "T1490", "T1498", "T1496", "T1489", "T1529",
  ];

  assert.equal(impact.length, 33);
  assert.equal(impact.filter(technique => !technique.parentId).length, parents.length);
  for (const id of parents) assert.ok(ids.has(id), id);
  for (const technique of impact.filter(item => item.parentId)) {
    assert.ok(ids.has(technique.parentId!), `${technique.id} -> ${technique.parentId}`);
  }
  for (const id of ["T1485.001", "T1565.003", "T1491.002", "T1561.002", "T1499.004", "T1496.004"]) {
    assert.ok(ids.has(id), id);
  }
  for (const id of ["T1485", "T1486", "T1490", "T1496"]) {
    assert.ok(MITRE_DB.find(technique => technique.id === id)?.tactics?.includes("Impact"), id);
  }
});
