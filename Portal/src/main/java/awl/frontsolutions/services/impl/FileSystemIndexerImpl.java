package awl.frontsolutions.services.impl;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import awl.frontsolutions.entities.*;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.tapestry5.func.F;
import org.apache.tapestry5.func.Flow;
import org.apache.tapestry5.func.Predicate;
import org.apache.tapestry5.ioc.annotations.Symbol;
import org.apache.tapestry5.ioc.internal.util.InternalUtils;
import org.apache.tapestry5.ioc.services.ThreadLocale;
import org.apache.tapestry5.services.javascript.JavaScriptStack;
import org.apache.tapestry5.services.javascript.JavaScriptStackSource;
import org.apache.tapestry5.services.javascript.StylesheetLink;
import org.slf4j.Logger;

import awl.frontsolutions.internal.ComponentConstants;
import awl.frontsolutions.services.ComponentUtils;
import awl.frontsolutions.services.FileSystemIndexer;
import awl.frontsolutions.services.stack.ThemeStack;
import awl.frontsolutions.treeDescription.NodeType;
import awl.frontsolutions.treeDescription.TreeNode;

public class FileSystemIndexerImpl implements FileSystemIndexer {

	private String root;

	private TreeNode fileStructure;

	private Map<String, TreeNode> linkToComponent;

	private Logger logger;

	private ThreadLocale threadLocale;

	private JavaScriptStackSource stackSource;

	private Map<String, String> componentStyles;

	private ComponentUtils componentUtils;

	private String rootPath;

	public List<TreeNode> searchComponent(final String term) {
		Flow<TreeNode> values = F.flow(linkToComponent.values()).filter(
				new Predicate<TreeNode>() {

					public boolean accept(TreeNode value) {
						boolean test1 = value.getNodeName().toLowerCase()
								.indexOf(term.toLowerCase()) != -1;
						boolean test2 = StringUtils.isNotEmpty(value.getCss())
								&& value.getCss().toLowerCase()
										.indexOf(term.toLowerCase()) != -1;
						return test1 || test2;
					}

				});
		return values.toList();

	}

	public FileSystemIndexerImpl(
			@Symbol(ComponentConstants.FILE_INDEXER_ROOT) String root,
			Logger logger, ThreadLocale threadLocale,
			JavaScriptStackSource stackSource, ComponentUtils componentUtils) {
		super();
		this.root = root;
		this.logger = logger;
		this.threadLocale = threadLocale;
		linkToComponent = new TreeMap<String, TreeNode>();
		this.stackSource = stackSource;
		this.componentUtils = componentUtils;
		reParseFileStructure();
	}

	public void reParseFileStructure() {
		componentStyles = getCssByTheme();
		File rootFile = new File(root);
		fileStructure = parseStructure(rootFile);
	}

	public TreeNode getFileStructure() {
		// reParseFileStructure();
		return fileStructure;
	}

	public Map<String, TreeNode> getLinkToComponent() {
		return linkToComponent;
	}

	private TreeNode parseStructure(File rootFile) {
		return parseStructure(rootFile, 0, null);
	}

	private TreeNode parseStructure(File rootFile, int level, TreeNode parent) {
		logger.info("Parsing directory [{}]", rootFile.toString());
		TreeNode tn = new TreeNode();
		tn.setLevel(level);
		if (rootFile.isDirectory()) {
			try {
				// Put properties into node
				if (level == 0) {
					rootPath = rootFile.getPath();
					tn.setNodeName("root");
					tn.setNodeType(NodeType.GROUP);
				} else {
					Properties properties = findProperties(rootFile);
					tn.setNodeName(properties
							.getProperty(ComponentConstants.METADATA_NAME_KEY));
					tn.setNodeType(NodeType.valueOf(properties
							.getProperty(ComponentConstants.METADATA_TYPE_KEY)
							.toUpperCase().trim()));
					tn.setPath(rootFile.getPath());
					tn.setRelatifPath(rootFile.getPath().substring(
							(rootPath.length() + 1)));
					if (tn.getNodeType().equals(NodeType.COMPONENT)) {
						tn.setParent(parent);
						tn.setUrlParam(properties
								.getProperty(ComponentConstants.METADATA_URL_PARAM));
						tn.setTags(properties
								.getProperty(ComponentConstants.METADATA_TAG));
						tn.setCss(properties
								.getProperty(ComponentConstants.METADATA_CSS));
						tn.setContent(getComponentContent(rootFile,
								tn.getUrlParam()));

						String version = "1.0";

						if (InternalUtils
								.isNonBlank(properties
										.getProperty(ComponentConstants.METADATA_VERSION)))
							version = properties
									.getProperty(ComponentConstants.METADATA_VERSION);

						tn.setVersion(version);
						linkToComponent.put(tn.getUrlParam(), tn);
					}

				}
				// list other files
				File[] fileArray = rootFile.listFiles(new FileFilter() {
					public boolean accept(File pathname) {
						return !pathname.getName().equals(
								ComponentConstants.METADATA_FILE_NAME)
								&& !pathname.getName().equals(
										ComponentConstants.DEPENDENCIES_DIR)
								&& !pathname.getName().equals(
										ComponentConstants.DOC_DIR)
								&& pathname.isDirectory();
					}

				});
				for (File file : fileArray) {
					TreeNode n = parseStructure(file, level + 1, tn);
					if (n != null) {
						tn.addChild(n);
					}
				}

				return tn;

			} catch (Exception e) {
				logger.warn(
						"problem reading metadata file found in the directory {} ({})",
						rootFile.getAbsolutePath(), e.getClass());
				return null;
			}
		} else {
			tn.setNodeName(rootFile.getName());
			tn.setNodeType(NodeType.COMPONENT);
			tn.setLevel(level + 1);
			return tn;
		}
	}

	private Properties findProperties(File rootFile) throws IOException {
		File properties = new File(rootFile.getPath() + File.separator
				+ ComponentConstants.METADATA_FILE_NAME);
		if (properties.exists()) {
			Properties p = new Properties();
			FileInputStream fis = new FileInputStream(properties);
			p.load(fis);
			fis.close();
			return p;
		} else {
			throw new FileNotFoundException();
		}
	}

	private Map<String, String> getCssByTheme() {

		Map<String, String> retour = new HashMap<String, String>();

		// Looking for themes
		List<String> stackNames = stackSource.getStackNames();

		for (String stackName : stackNames) {

			if (stackName.startsWith(ThemeStack.PREFIX)) {
				// Looking for K-themeX.css file

				JavaScriptStack stack = stackSource.getStack(stackName);

				List<StylesheetLink> stylesheets = stack.getStylesheets();

				for (StylesheetLink stylesheet : stylesheets) {

					String[] path = stylesheet.getURL().split("/");

					String fileName = path[path.length - 1];

					if (fileName.startsWith("k-theme")
							&& fileName.endsWith(".css")) {

						try {
							retour.put(stackName, IOUtils
									.toString(componentUtils
											.getResourceFormStylesheetLink(
													stylesheet).openStream()));
						} catch (IOException e) {

						}
					}
				}
			}
		}

		return retour;
	}

	private Map<String, String> getComponentCSS(String urlParam) {
		Map<String, String> retour = new HashMap<String, String>();
		String rgxp = "/\\* CB/\\s*" + urlParam
				+ "\\s*\\*/\\s*(.*)\\s*/\\* CE/\\s*" + urlParam + "\\s*\\*/";
		Pattern p = Pattern.compile(rgxp, Pattern.DOTALL);
		Set<String> themes = componentStyles.keySet();
		for (String theme : themes) {
			String style = componentStyles.get(theme);
			Matcher m = p.matcher(style);
			while (m.find()) {
				retour.put(theme, m.group(1));
			}
		}

		return retour;
	}

	private ComponentContent getComponentContent(File rootFile, String urlParam) {

		String basedir = rootFile.getPath() + File.separator;

		ComponentContent retour = new ComponentContent();

		readAfterBeforeWords(retour, basedir);

		readHtml5Directory(retour, basedir, rootFile);

		readJsDependencies(retour, basedir);
		
		readXhtmlDirectory(retour, urlParam, basedir);

		readTapestryDirectory(retour, basedir);

        readAngularDirectory(retour, basedir);

		readDocumentationDirectory(basedir, retour);

		return retour;
	}

	private void readDocumentationDirectory(String basedir,
			ComponentContent retour) {
		// documentation reading
		try {
			logger.info("reading documentation...");
			File docDir = new File(basedir + ComponentConstants.DOC_DIR);
			if (docDir.exists()) {
				Properties docInfo = new Properties();
				docInfo.load(new FileInputStream(basedir
						+ ComponentConstants.DOC_DIR + File.separator
						+ ComponentConstants.DOC_INFO_FILE));
				Set<String> files = docInfo.stringPropertyNames();

				String lang = threadLocale.getLocale().getLanguage()
						.toLowerCase();
				for (String file : files) {
					File doc = new File(basedir + ComponentConstants.DOC_DIR
							+ File.separator + file);
					if (!doc.exists()) {
						// On cherche ds le dossier de la locale
						doc = new File(basedir + ComponentConstants.DOC_DIR
								+ File.separator + lang + File.separator + file);
						if (!doc.exists()) {
							// On cherche ds la documentation générale
							doc = new File(root + File.separator
									+ ComponentConstants.DOC_DIR
									+ File.separator + file);
							if (!doc.exists()) {
								// On cherche ds la documentation générale
								// avec la locale
								doc = new File(root + File.separator
										+ ComponentConstants.DOC_DIR
										+ File.separator + lang
										+ File.separator + file);
								if (!doc.exists()) {
									doc = null;
								}
							}
						}
					}
					if (doc != null) {
						Documentation d = new Documentation();
						d.setLabel(doc.getName() + " ["
								+ componentUtils.formatFileSize(doc.length())
								+ "]");
						String description = (String) docInfo.get(file);
						String[] descriptions = description
								.split("\\s*\\|\\s*");
						if (descriptions.length <= 1) {
							d.setDescriptionFr(description);
							d.setDescriptionEn(description);
						} else {
							d.setDescriptionFr(descriptions[0]);
							d.setDescriptionEn(descriptions[1]);
						}

						d.setPath(doc.getAbsolutePath());
						retour.getDocumentation().add(d);

					}
				}
			}
		} catch (FileNotFoundException e) {
			logger.error("Error while reading documentation", e);
		} catch (IOException e) {
			logger.error("Error while reading documentation", e);
		}
	}

	private ComponentContent readXhtmlDirectory(ComponentContent retour,
			String urlParam, String root) {

		String basedir = root + ComponentConstants.XHTML_FOLDER
				+ File.separator;

		Object[] obj = readFile(basedir + ComponentConstants.SNIPPET_HTML);
		if (obj != null) {
			retour.setSnippetHTML((String) obj[0]);
			retour.setEscapedSnippetHTML((List<String>) obj[1]);
		}

		obj = readFile(basedir + ComponentConstants.SNIPPET_JS);
		if (obj != null) {
			retour.setSnippetJS((String) obj[0]);
			retour.setEscapedSnippetJS((List<String>) obj[1]);
		}

		// css reading
		Map<String, String> styles = getComponentCSS(urlParam);
		Set<String> themes = styles.keySet();
		for (String theme : themes) {
			// logger.info("adding CSS for theme '{}'",theme);
			try {
				String cssContent = styles.get(theme);
				retour.addSnippetCSS(theme, cssContent);
				List<String> escaped = new ArrayList<String>();
				InputStreamReader isr = new InputStreamReader(
						IOUtils.toInputStream(cssContent));
				BufferedReader br = new BufferedReader(isr);
				String s;
				while ((s = br.readLine()) != null) {
					escaped.add(s);
				}
				isr.close();
				retour.addEscapedSnippetCSS(theme, escaped);
			} catch (IOException e) {
				// logger.info("Impossible to read CSS");
			}

		}

		
		retour.setReadMoreHTML((String) readFile(basedir + ComponentConstants.READMORE_HTML)[0]);
		retour.setReadMoreCSS((String) readFile(basedir + ComponentConstants.READMORE_CSS)[0]);
		retour.setReadMoreJS((String) readFile(basedir + ComponentConstants.READMORE_JS)[0]);
		
		return retour;
	}

	private void readJsDependencies(ComponentContent retour, String basedir) {
		// js dependencies reading
		try {
			// logger.info("reading JS dependencies...");
			File dependenciesDir = new File(basedir
					+ ComponentConstants.DEPENDENCIES_DIR);
			File[] fileArray = dependenciesDir.listFiles(new FileFilter() {
				public boolean accept(File pathname) {
					return pathname.isFile()
							&& pathname.getName().endsWith(".js");
				}

			});
			if (fileArray != null) {
				for (int i = 0; i < fileArray.length; i++) {
					File file = fileArray[i];
					JSDependency jsdep = new JSDependency();
					jsdep.setLabel(file.getName() + " ["
							+ componentUtils.formatFileSize(file.length())
							+ "]");
					jsdep.setPath(file.getName());
					InputStream fis = new FileInputStream(
							file.getAbsoluteFile());
					jsdep.setContent(IOUtils.toString(fis));
					fis.close();
					retour.getJsDependencies().add(jsdep);
				}
			}
		} catch (Exception e) {
			// logger.info("> no JS dependencies");
		}
	}

    private void readAngularDirectory(ComponentContent retour, String basedir) {
        File AngularDirectory = new File(basedir
                + ComponentConstants.ANGULAR_FOLDER + File.separator);

        Map<String, AngularDocumentation> docs = new HashMap<String, AngularDocumentation>();

        if (AngularDirectory.exists()) {
            for (File subDir : AngularDirectory.listFiles()) {
                if (subDir.isDirectory() && !subDir.getName().startsWith(".")) {

                    AngularDocumentation doc = new AngularDocumentation(
                            subDir.getName());
                    Object[] js = readFile(subDir + File.separator
                            + ComponentConstants.SNIPPET_HTML);

                    if (js != null) {
                        doc.setHtml((String) js[0]);
                        doc.setEscapedHtml((List<String>) js[1]);
                    }

                    js = readFile(subDir + File.separator
                            + ComponentConstants.SNIPPET_JS);
                    if (js != null) {
                        doc.setJs((String) js[0]);
                        doc.setEscapedJs((List<String>) js[1]);
                    }

                    js = readFile(subDir + File.separator
                            + ComponentConstants.FOREWORDS);
                    if (js != null)
                        doc.setForewords((String) js[0]);

                    js = readFile(subDir + File.separator
                            + ComponentConstants.READMORE_TML);
                    if (js != null)
                        doc.setReadmeTemplate((String) js[0]);

                    js = readFile(subDir + File.separator
                            + ComponentConstants.READMORE_JS);
                    if (js != null)
                        doc.setReadmeJs((String) js[0]);

                    docs.put(subDir.getName(), doc);
                }
            }
        }
        retour.setAngular(docs);
    }
	/**
	 * Method used to read all the Tapestry documentation for a Component
	 * 
	 * @param retour
	 * @param basedir
	 *            : the components directory
	 */
	private void readTapestryDirectory(ComponentContent retour, String basedir) {
		File TapestryDirectory = new File(basedir
				+ ComponentConstants.TAPESTRY_FOLDER + File.separator);

		Map<String, TapestryDocumentation> docs = new HashMap<String, TapestryDocumentation>();

		if (TapestryDirectory.exists()) {
			for (File subDir : TapestryDirectory.listFiles()) {
				if (subDir.isDirectory() && !subDir.getName().startsWith(".")) {

					TapestryDocumentation doc = new TapestryDocumentation(
							subDir.getName());
					Object[] js = readFile(subDir + File.separator
							+ ComponentConstants.SNIPPET_TML);

					if (js != null) {
						doc.setTemplate((String) js[0]);
						doc.setEscapedTemplate((List<String>) js[1]);
					}

					js = readFile(subDir + File.separator
							+ ComponentConstants.SNIPPET_JAVA);
					if (js != null) {
						doc.setJava((String) js[0]);
						doc.setEscapedJava((List<String>) js[1]);
					}

					js = readFile(subDir + File.separator
							+ ComponentConstants.SNIPPET_JS);
					if (js != null) {
						doc.setJs((String) js[0]);
						doc.setEscapedJs((List<String>) js[1]);
					}

					js = readFile(subDir + File.separator
							+ ComponentConstants.FOREWORDS);
					if (js != null)
						doc.setForewords((String) js[0]);

					js = readFile(subDir + File.separator
							+ ComponentConstants.READMORE_TML);
					if (js != null)
						doc.setReadmeTemplate((String) js[0]);

					js = readFile(subDir + File.separator
							+ ComponentConstants.READMORE_JAVA);
					if (js != null)
						doc.setReadmeJava((String) js[0]);

					js = readFile(subDir + File.separator
							+ ComponentConstants.READMORE_JS);
					if (js != null)
						doc.setReadmeJs((String) js[0]);

					docs.put(subDir.getName(), doc);
				}
			}
		}
		retour.setTapestry(docs);
	}

	private void readHtml5Directory(ComponentContent retour, String basedir,
			File rootFile) {

		HTML5Documentation html5 = new HTML5Documentation();

		// HTML5 reading
		Object[] code = readFile(basedir + ComponentConstants.SNIPPET_HTML);

		html5.setSnippetHTML5((String) code[0]);
		html5.setEscapedSnippetHTML5((List<String>) code[1]);

		// css3 reading
		File[] fileArray = rootFile.listFiles(new FileFilter() {
			public boolean accept(File filename) {
				return filename.getName().startsWith("snippet")
						&& filename.getName().endsWith(".css");
			}
		});
		for (File file : fileArray) {
			code = readFile(basedir + file.getName());
			html5.getSnippetsCSS3().put(file.getName(), (String) code[0]);
			html5.getEscapedSnippetsCSS3().put(file.getName(),
					(List<String>) code[1]);
		}

		code = readFile(basedir + ComponentConstants.SNIPPET_JS);

		html5.setSnippetJS5((String) code[0]);
		html5.setEscapedSnippetJS5((List<String>) code[1]);
		html5.setReadMoreHTML5((String) readFile(basedir
				+ ComponentConstants.READMORE_HTML)[0]);
		html5.setReadMoreCSS3((String) readFile(basedir
				+ ComponentConstants.READMORE_CSS)[0]);
		html5.setReadMoreJS5((String) readFile(basedir
				+ ComponentConstants.READMORE_JS)[0]);

		retour.setHtml5(html5);

	}

	private void readAfterBeforeWords(ComponentContent retour, String basedir) {
		
		retour.setForewords((String) readFile(basedir + ComponentConstants.FOREWORDS)[0]);
		
		retour.setAfterwords((String) readFile(basedir + ComponentConstants.AFTERWORDS)[0]);
	}

	/**
	 * TODO
	 */
	private Object[] readFile(String path) {
		try {
			logger.info("reading {}...", path);
			Object[] obj = componentUtils.readAndEscapeFile(path);
			return obj;
		} catch (Exception e) {
			logger.info("> no {}", path);
		}
		return new Object[2];
	}

	public void setToRebuilt() {
		for (TreeNode child : fileStructure.getChildren()) {
			setToRebuilt(child);
		}
	}

	private void setToRebuilt(TreeNode node) {
		if (node.getContent() != null)
			node.getContent().setRebuilt(false);
		for (TreeNode child : node.getChildren()) {
			setToRebuilt(child);
		}
	}
}