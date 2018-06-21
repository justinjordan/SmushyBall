try
{
	if (typeof require === 'undefined')
		{ throw new Error("RequireJS is not loaded. Please download it at http://requirejs.org/ and include it in your page."); }

	require.config({
		baseUrl: 'src'
	})(['smushyball'], function(smushyball) {
		console.log(smushyball);
	});
}
catch (e)
{
	console.error(e.message);
}
