import { Project, SyntaxKind, Block, Statement } from "ts-morph";

const project = new Project();
project.addSourceFilesAtPaths("apps/web-viewer/src/**/*.ts");

const files = project.getSourceFiles();

for (const sourceFile of files) {
  let changed = false;

  // 1. Replace import of setTenantContext with withTenantContext
  const importDecls = sourceFile.getImportDeclarations();
  for (const imp of importDecls) {
    if (imp.getModuleSpecifierValue() === "@dba/database") {
      const namedImports = imp.getNamedImports();
      for (const ni of namedImports) {
        if (ni.getName() === "setTenantContext") {
          ni.setName("withTenantContext");
          changed = true;
        }
      }
    }
  }

  // 2. Find setTenantContext calls
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  const setTenantCalls = calls.filter(c => c.getExpression().getText() === "setTenantContext");

  for (const call of setTenantCalls) {
    // Usually it's `await setTenantContext(db, tenantId);`
    const awaitExpr = call.getParentIfKind(SyntaxKind.AwaitExpression);
    const statement = (awaitExpr ? awaitExpr.getParentIfKind(SyntaxKind.ExpressionStatement) : call.getParentIfKind(SyntaxKind.ExpressionStatement));
    
    if (!statement) {
      console.log(`Warning: Could not find statement for setTenantContext in ${sourceFile.getFilePath()}`);
      continue;
    }

    const args = call.getArguments();
    if (args.length !== 2) continue;
    const dbArg = args[0].getText();
    const tenantIdArg = args[1].getText();

    const block = statement.getParent();
    if (!block || (!Block.isBlock(block) && block.getKind() !== SyntaxKind.SourceFile && block.getKind() !== SyntaxKind.CaseBlock)) {
      console.log(`Warning: Parent is not a block in ${sourceFile.getFilePath()}`);
      continue;
    }

    // Get all statements after this one
    const stmtIndex = statement.getChildIndex();
    const allStmts = block.getStatements();
    const stmtsAfter = allStmts.slice(stmtIndex + 1);

    const innerCode = stmtsAfter.map(s => s.getText()).join("\n");
    // Replace `db.` with `tx.` in innerCode (simple regex, assuming `db` is the variable)
    const newInnerCode = innerCode.replace(/\bdb\./g, "tx.");

    // Determine what to replace the statement with
    // If the block ends with a return, we might want to return the withTenantContext.
    // Let's just wrap everything.
    let wrapper = `await withTenantContext(${dbArg}, ${tenantIdArg}, async (tx) => {\n${newInnerCode}\n});`;
    
    // Check if the last statement was a return
    const lastStmt = stmtsAfter[stmtsAfter.length - 1];
    if (lastStmt && lastStmt.getKind() === SyntaxKind.ReturnStatement) {
      wrapper = `return withTenantContext(${dbArg}, ${tenantIdArg}, async (tx) => {\n${newInnerCode}\n});`;
      // remove the return from inside the innerCode
      const innerCodeNoReturn = stmtsAfter.slice(0, -1).map(s => s.getText()).join("\n").replace(/\bdb\./g, "tx.");
      const retExpr = lastStmt.asKind(SyntaxKind.ReturnStatement)?.getExpression();
      const retText = retExpr ? `return ${retExpr.getText().replace(/\bdb\./g, "tx.")};` : "return;";
      wrapper = `return withTenantContext(${dbArg}, ${tenantIdArg}, async (tx) => {\n${innerCodeNoReturn}\n${retText}\n});`;
    }

    // Replace the statement and remove the following ones
    statement.replaceWithText(wrapper);
    for (const s of stmtsAfter) {
      s.remove();
    }
    
    changed = true;
  }

  if (changed) {
    console.log(`Saving ${sourceFile.getFilePath()}`);
    sourceFile.saveSync();
  }
}
