import { FileTrieNode } from "./fileTrie";
export function trieFromAllFiles(allFiles) {
    const trie = new FileTrieNode([]);
    allFiles.forEach((file) => {
        if (file.frontmatter) {
            trie.add({
                ...file,
                slug: file.slug,
                title: file.frontmatter.title,
                filePath: file.filePath,
            });
        }
    });
    return trie;
}
