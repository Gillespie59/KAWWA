package awl.frontsolutions.components;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.apache.tapestry5.BindingConstants;
import org.apache.tapestry5.ComponentResources;
import org.apache.tapestry5.annotations.Component;
import org.apache.tapestry5.annotations.Import;
import org.apache.tapestry5.annotations.OnEvent;
import org.apache.tapestry5.annotations.Parameter;
import org.apache.tapestry5.annotations.Property;
import org.apache.tapestry5.annotations.SessionState;
import org.apache.tapestry5.ioc.annotations.Inject;
import org.apache.tapestry5.services.AssetSource;
import org.got5.tapestry5.jquery.ImportJQueryUI;

import awl.frontsolutions.entities.ChoosenTheme;
import awl.frontsolutions.entities.DASUser;
import awl.frontsolutions.entities.Panier;


@ImportJQueryUI(value={"jquery.ui.tabs","jquery.ui.button","jquery.ui.accordion"})
@Import(library={"context:js/plugins/ZeroClipboard.js","context:js/plugins/jquery.ui.panel.js"})
public class Layout
{
	
    /** The page title, for the <title> element and the <h1> element. */
	@Property
    @Parameter(defaultPrefix = BindingConstants.LITERAL)
    private String title;

    @Property
    private String pageName;

    @Property
    private boolean loggedUserExists;

    @SessionState
    private ChoosenTheme choosen;

    @SessionState
    private DASUser loggedUser;
    
    @SessionState
    private Panier panier;

    @Component(publishParameters="activeMenu")
    private TopMenu topmenu;

    @Inject
    private ComponentResources resources;
    
    @Inject
    private AssetSource as;
    
    public String getClassForPageName()
    {
      return resources.getPageName().equalsIgnoreCase(pageName)
             ? "current_page_item"
             : null;
    }
    
    public String getCurrentYear(){
    	DateFormat sdf = new SimpleDateFormat("yyyy");
    	return sdf.format(new Date());
    }


    public String getLogoUrl(){
    	return as.getContextAsset("img/"+choosen.getDir()+"/logo_Graphikawwa-trans.png", null).toClientURL();
    }
    public String getFaviconUrl(){
    	return as.getContextAsset("img/"+choosen.getDir()+"/favicon.png", null).toClientURL();
    }

    
	@OnEvent("logout")
	private void logout(){
		
		panier = null;
		loggedUser = null;
		
	}
}
