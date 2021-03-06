package awl.frontsolutions.pages;

import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.List;

import org.apache.tapestry5.annotations.Import;
import org.apache.tapestry5.ioc.Messages;
import org.apache.tapestry5.ioc.annotations.Inject;

@Import(stack="themestack")
public class Tapestry {

	@Inject private Messages messages;
	
	public String getReadmore(){ return "";}
	
	public List<String> getSnippet() throws MalformedURLException{
		List<String> snippet = new ArrayList<String>();
		
		
		snippet.add("<dependencies>");
		snippet.add("	<dependency>");
		snippet.add("		<groupId>net.atos.tapestry</groupId>");
		snippet.add("		<artifactId>tapestry5-kawwa-components</artifactId>");
		snippet.add("		<version>" + messages.get("tapestry-library-component") + "</version>");
		snippet.add("	</dependency>");
		snippet.add("</dependencies>");
		
		snippet.add("<repositories>");
		snippet.add("	<repository>");
		snippet.add("		<id>Kawwa2</id>");	
		snippet.add("		<name>Kawwa2 Repository</name>");
		snippet.add("		<url>http://nexus.devlab722.net/nexus/content/repositories/snapshots/</url>");
		snippet.add("	</repository>");
		snippet.add("</repositories>");
		
		return snippet;
	}
}
