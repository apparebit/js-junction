# @grr/knowledge

> Making the JSON-LD flavor of Schema.org palatable.

The __@grr/knowledge__ package simplifies ingestion and processing of linked
data encoded as [JSON-LD](https://json-ld.org), preferrably using the
[Schema.org](http://schema.org) vocabulary. This package does *not* provide a
general framework for processing arbitrary linked data. Rather it only
implements targeted APIs for:

 1. Normalizing linked data using a single uniform vocabulary during possibly
    peacemeal ingestion;
 2. Maintaining the resulting index of graph nodes in-memory;
 3. Providing a proxy-based view to transparently skip embedded JSON-LD
    references and metadata, thus letting application focus on data semantics.

To put it differently, __@grr/knowledge__ is targeted at applications, such as
static website generators, that process linked data, such as the metadata for
the website and its pages. The data easily fits into main memory and has a
uniform vocabulary, preferrably Schema.org. Furthermore, such applications mix
the looking up of properties in mostly tabular data, such as a particular
webpage's title, description, and images, with tracing relations through the
entire corpus, such as authors and publishers for articles appearing on the
website. This package's repository sibling __@grr/apparebit-com__ builds on
[such a site
description](https://github.com/apparebit/js-junction/tree/master/packages/apparebit-com/site.jsonld).

## Savoring JSON-LD in Moderation

The choices of format and ontology are significant. First, JSON-LD provides a
surprisingly straight-forward evolutionary path from ad-hoc encodings of data in
[JSON](http://json.org) to interoperable standards based on an established data
model, the W3C's [Resource Description Framework
(RDF)](https://www.w3.org/TR/rdf11-concepts/). Second, Schema.org was founded by
Google, Microsoft, Yahoo, and Yandex as an open and collaborative effort. The
vocabulary reflects that approach by being both expressive — thanks to many
contributors with different areas of expertise — yet also practical — thanks to
the founding companies' focus on globally scalable services. As such, it is a
welcome departure from earlier, more academic efforts as well as recent attempts
by a single company to impose its own design, notably Facebook's far more
limited and verbose [Open Graph protocol](http://ogp.me).

Having said that, the flexibility of JSON-LD in mapping arbitrary vocabularies
onto varying arrangements of JSON data has a substantial cost of generality. The
combination of core [JSON-LD processing
algorithms](https://json-ld.org/spec/latest/json-ld-api/) and [data
framing](https://json-ld.org/spec/latest/json-ld-framing/) is non-trivial, yet
it also is neither always necessary nor sufficient. To return to the example of
a static website generator, the site description for the website itself, landing
and topic pages, prolific authors, and the publisher probably is a single
document maintained by the webmaster team. Doing so nicely fits into the remit
of a team already concerned with information architecture in general and
metadata for optimizing search in particular. At the same time, more specific
information necessarily originates with individual authors through their
articles' front matter. The website generator combines the different fragments
and renders the site's pages based on that information. It also embeds some of
that data in the pages as metadata for search engines and social networks.

To generalize, there is a class of applications that clearly benefit from having
semantically meaningful data available and, in turn, contribute some of that
data to other applications. But they distinctly do not require the full
flexibility and complexity of JSON-LD or RDF. Rather, a single vocabulary and
its default encoding as JSON data will do. Consequently, a fully featured
implementation of standard algorithms such as Digital Bazaar's
[jsonld.js](https://github.com/digitalbazaar) is overkill and a more targeted
and lightweight library is needed. __@grr/knowledge__ is that library. It works
for applications that meet the following requirements:

  * Data utilizes the same vocabulary throughout. A `@context` reference through
    an internationalized resource identifier (IRI) identifies that vocabulary.
  * Data is in compact form, i.e., all IRIs have been replaced by terms.
  * Working sets easily fit into main memory.
  * While embedded nodes may be blank, i.e., do not have an `@id`, every root
    node of the only (default) graph must have an `@id`.
  * Similarly, nodes with out-going `@reverse` properties must have an `@id`.
  * A node's properties must be defined exactly once, in a single node object.
    All other mentions of the same node must be references, i.e., a JSON object
    with a sole `@id` property.
  * Blank node identifiers, i.e., IRIs starting with `_:`, are not yet supported
    but probably will be at some point.

During ingestion, __@grr/knowledge__ validates the data and creates a mapping
from `@id` to node objects. It removes embedded non-blank nodes, adding them to
the node map and updating the property value with a symbolic reference. If
possible, it augments `@reverse` properties by adding the corresponding forward
property to the graph. Similarly, it augments every property that has an inverse
— Schema.org 3.3 has 15 such pairs including `member` and `memberOf` — with the
inverse property.

While the resulting node map can be accessed and updated directly, this package
provides an alternative view onto the data that simplifies graph traversal
tremendously. This graph view is implemented through JavaScript proxies whose
read traps automatically resolve `@id` references to the full node objects and
skip `@list`, `@set`, and `@value` objects for their values. The proxies' write
traps currently fail, since updates must consider data layout.

--------------------------------------------------------------------------------

## ECMAScript Only

This package contains only ECMAScript modules with the `.js` file extension. It
may not run natively on Node.js without a suitable [loader
hook](https://nodejs.org/dist/latest-v9.x/docs/api/esm.html#esm_loader_hooks).
It does, however, run with [esm](https://github.com/standard-things/esm), a
light-weight just-in-time transpiler for Node.js 6 or later.

## Copyright and License

© 2018 [Robert Grimm](http://apparebit.com), released under the [MIT
license](LICENSE).
